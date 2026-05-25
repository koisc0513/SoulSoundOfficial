package com.soulsound.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.soulsound.entity.Role;
import com.soulsound.entity.User;
import com.soulsound.entity.UserStatus;
import com.soulsound.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * OAuthUserService – xác minh token Google/Facebook và tạo/lấy User nội bộ.
 *
 * Luồng hoạt động:
 *  1. Frontend đăng nhập với Google/Facebook rồi lấy được idToken (Google)
 *     hoặc accessToken (Facebook).
 *  2. Frontend gửi token đó lên backend (/api/auth/google hoặc /api/auth/facebook).
 *  3. Backend gọi service này để:
 *     a. Xác minh token với Google/Facebook servers (không dùng thư viện OAuth redirect).
 *     b. Lấy email + tên từ payload đã xác minh.
 *     c. Tìm hoặc tự động tạo User trong DB (không cần mật khẩu).
 *  4. Trả về User để controller đổi thành JWT nội bộ.
 */
@Service
@Transactional
public class OAuthUserService {

    @Value("${oauth.google.client-id}")
    private String googleClientId;

    @Value("${oauth.facebook.app-id}")
    private String facebookAppId;

    @Value("${oauth.facebook.app-secret}")
    private String facebookAppSecret;

    private final UserRepository  userRepo;
    private final PasswordEncoder passwordEncoder;

    public OAuthUserService(UserRepository userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo        = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GOOGLE
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Xác minh Google ID Token và trả về User nội bộ.
     *
     * @param idTokenString  chuỗi token nhận từ Google Sign-In (credential)
     * @return User đã tồn tại hoặc mới tạo
     * @throws IllegalArgumentException nếu token không hợp lệ
     */
    public User loginWithGoogle(String idTokenString) {
        GoogleIdToken.Payload payload = verifyGoogleToken(idTokenString);

        String email    = payload.getEmail();
        String fullName = (String) payload.get("name");
        String picture  = (String) payload.get("picture");

        return findOrCreate(email, fullName, picture, "GOOGLE");
    }

    /** Gọi Google tokeninfo endpoint để xác minh token. */
    private GoogleIdToken.Payload verifyGoogleToken(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new IllegalArgumentException("Google ID Token không hợp lệ hoặc đã hết hạn.");
            }
            return idToken.getPayload();

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Không thể xác minh Google token: " + e.getMessage(), e);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // FACEBOOK
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Xác minh Facebook Access Token và trả về User nội bộ.
     *
     * @param accessToken  chuỗi access token nhận từ Facebook Login SDK
     * @return User đã tồn tại hoặc mới tạo
     * @throws IllegalArgumentException nếu token không hợp lệ
     */
    public User loginWithFacebook(String accessToken) {
        Map<String, Object> fbUser = verifyFacebookToken(accessToken);

        String email    = (String) fbUser.get("email");
        String fullName = (String) fbUser.get("name");
        String picture  = extractFacebookPicture(fbUser);

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException(
                    "Tài khoản Facebook không chia sẻ email. Vui lòng dùng phương thức đăng nhập khác.");
        }

        return findOrCreate(email, fullName, picture, "FACEBOOK");
    }

    /**
     * Gọi Facebook Graph API để xác minh token và lấy thông tin user.
     * Dùng app-access-token (appId|appSecret) làm app token để debug user token.
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> verifyFacebookToken(String userAccessToken) {
        WebClient client = WebClient.create("https://graph.facebook.com");

        // Bước 1: Debug token (kiểm tra token có hợp lệ và thuộc app này không)
        String appToken  = facebookAppId + "|" + facebookAppSecret;
        Map<String, Object> debug = client.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/debug_token")
                        .queryParam("input_token",  userAccessToken)
                        .queryParam("access_token", appToken)
                        .build())
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (debug == null) {
            throw new IllegalArgumentException("Không thể liên lạc Facebook Graph API.");
        }

        Map<String, Object> data = (Map<String, Object>) debug.get("data");
        if (data == null || Boolean.FALSE.equals(data.get("is_valid"))) {
            throw new IllegalArgumentException("Facebook Access Token không hợp lệ.");
        }

        // Kiểm tra token thuộc đúng app
        String tokenAppId = String.valueOf(data.get("app_id"));
        if (!facebookAppId.equals(tokenAppId)) {
            throw new IllegalArgumentException("Facebook token không thuộc ứng dụng này.");
        }

        // Bước 2: Lấy thông tin user
        Map<String, Object> fbUser = client.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/me")
                        .queryParam("fields", "id,name,email,picture.type(large)")
                        .queryParam("access_token", userAccessToken)
                        .build())
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (fbUser == null) {
            throw new IllegalArgumentException("Không thể lấy thông tin từ Facebook.");
        }
        return fbUser;
    }

    @SuppressWarnings("unchecked")
    private String extractFacebookPicture(Map<String, Object> fbUser) {
        try {
            Map<String, Object> pic  = (Map<String, Object>) fbUser.get("picture");
            Map<String, Object> data = (Map<String, Object>) pic.get("data");
            return (String) data.get("url");
        } catch (Exception e) {
            return null;
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SHARED: tìm hoặc tạo user
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Nếu email đã tồn tại trong DB → trả về user đó (dù đăng ký kiểu nào).
     * Nếu chưa có → tự động tạo user mới với mật khẩu ngẫu nhiên (không cần nhập).
     *
     * @param provider  "GOOGLE" hoặc "FACEBOOK" – chỉ dùng để log, không lưu vào DB
     *                  (tránh thay đổi schema hiện tại)
     */
    private User findOrCreate(String email, String fullName, String avatarUrl, String provider) {
        Optional<User> existing = userRepo.findByEmail(email);
        if (existing.isPresent()) {
            User u = existing.get();
            if (u.getStatus() == UserStatus.BLOCKED) {
                throw new IllegalArgumentException("Tài khoản đã bị khóa.");
            }
            return u;
        }

        // Tạo user mới – mật khẩu random vì user sẽ không dùng đến
        User user = new User();
        user.setEmail(email);
        user.setFullName(fullName != null ? fullName : email.split("@")[0]);
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setAvatarUrl(avatarUrl);
        user.setRole(Role.USER);
        user.setStatus(UserStatus.ACTIVE);
        return userRepo.save(user);
    }
}
