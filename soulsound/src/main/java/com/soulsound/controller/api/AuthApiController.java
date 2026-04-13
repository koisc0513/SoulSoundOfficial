package com.soulsound.controller.api;

import com.soulsound.dto.RegisterDto;
import com.soulsound.entity.User;
import com.soulsound.security.JwtUtil;
import com.soulsound.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthApiController {

    private final AuthenticationManager authManager;
    private final JwtUtil               jwtUtil;
    private final UserService           userService;

    public AuthApiController(AuthenticationManager authManager,
                             JwtUtil jwtUtil,
                             UserService userService) {
        this.authManager = authManager;
        this.jwtUtil     = jwtUtil;
        this.userService = userService;
    }

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            Authentication auth = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            body.get("email"), body.get("password"))
            );

            String email = auth.getName();
            User user    = userService.findByEmail(email);

            if (!user.isActive()) {
                return ResponseEntity.status(403)
                        .body(Map.of("error", "Tài khoản đã bị khóa."));
            }

            String token = jwtUtil.generateToken(email);

            return ResponseEntity.ok(Map.of(
                    "token",     token,
                    "user",      buildUserDto(user)
            ));

        } catch (AuthenticationException e) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Email hoặc mật khẩu không đúng."));
        }
    }

    // POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterDto dto) {
        try {
            User user  = userService.register(dto);
            String token = jwtUtil.generateToken(user.getEmail());
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "user",  buildUserDto(user)
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/auth/me  — lấy thông tin user hiện tại từ token
    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails principal) {

        if (principal == null)
            return ResponseEntity.status(401).build();

        User user = userService.findByEmail(principal.getUsername());
        return ResponseEntity.ok(buildUserDto(user));
    }

    private Map<String, Object> buildUserDto(User u) {
        return Map.of(
                "id",            u.getId(),
                "fullName",      u.getFullName(),
                "email",         u.getEmail(),
                "avatarUrl",     u.getAvatarUrl() != null ? u.getAvatarUrl() : "",
                "bio",           u.getBio() != null ? u.getBio() : "",
                "role",          u.getRole().name(),
                "followerCount", u.getFollowerCount(),
                "followingCount",u.getFollowingCount()
        );
    }
}