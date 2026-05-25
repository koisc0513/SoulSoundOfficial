package com.soulsound.controller.api;

import com.soulsound.entity.User;
import com.soulsound.security.JwtUtil;
import com.soulsound.service.OAuthUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * OAuthApiController – 2 endpoint nhận token từ frontend và trả về JWT nội bộ.
 *
 * POST /api/auth/google   { "idToken": "..." }
 * POST /api/auth/facebook { "accessToken": "..." }
 *
 * Không chạm vào SecurityConfig cũ – chỉ thêm 2 request matchers trong permitAll.
 */
@RestController
@RequestMapping("/api/auth")
public class OAuthApiController {

    private final OAuthUserService oauthUserService;
    private final JwtUtil          jwtUtil;

    public OAuthApiController(OAuthUserService oauthUserService, JwtUtil jwtUtil) {
        this.oauthUserService = oauthUserService;
        this.jwtUtil          = jwtUtil;
    }

    /**
     * Đăng nhập bằng Google.
     * Frontend gửi: { "idToken": "<google_credential>" }
     */
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body) {
        String idToken = body.get("idToken");
        if (idToken == null || idToken.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Thiếu idToken."));
        }
        return processOAuth(() -> oauthUserService.loginWithGoogle(idToken));
    }

    /**
     * Đăng nhập bằng Facebook.
     * Frontend gửi: { "accessToken": "<fb_access_token>" }
     */
    @PostMapping("/facebook")
    public ResponseEntity<?> facebookLogin(@RequestBody Map<String, String> body) {
        String accessToken = body.get("accessToken");
        if (accessToken == null || accessToken.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Thiếu accessToken."));
        }
        return processOAuth(() -> oauthUserService.loginWithFacebook(accessToken));
    }

    // ── Helper ──────────────────────────────────────────────────────────────

    @FunctionalInterface
    private interface OAuthAction {
        User execute();
    }

    private ResponseEntity<?> processOAuth(OAuthAction action) {
        try {
            User   user  = action.execute();
            String token = jwtUtil.generateToken(user.getEmail());
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "user",  buildUserDto(user)
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Lỗi xác thực OAuth: " + e.getMessage()));
        }
    }

    private Map<String, Object> buildUserDto(User u) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",             u.getId());
        m.put("fullName",       u.getFullName());
        m.put("email",          u.getEmail());
        m.put("avatarUrl",      u.getAvatarUrl()  != null ? u.getAvatarUrl()  : "");
        m.put("bio",            u.getBio()         != null ? u.getBio()        : "");
        m.put("role",           u.getRole().name());
        m.put("followerCount",  u.getFollowerCount());
        m.put("followingCount", u.getFollowingCount());
        m.put("birthYear",      u.getBirthYear());
        m.put("phoneNumber",    u.getPhoneNumber() != null ? u.getPhoneNumber(): "");
        m.put("address",        u.getAddress()     != null ? u.getAddress()    : "");
        return m;
    }
}
