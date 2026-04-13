// FILE: src/main/java/com/soulsound/controller/api/AdminApiController.java
package com.soulsound.controller.api;

import com.soulsound.entity.*;
import com.soulsound.repository.TrackRepository;
import com.soulsound.service.TrackService;
import com.soulsound.service.UserService;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminApiController {

    private final UserService  userService;
    private final TrackService trackService;

    public AdminApiController(UserService userService, TrackService trackService) {
        this.userService  = userService;
        this.trackService = trackService;
    }

    // GET /api/admin/dashboard
    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard() {
        return ResponseEntity.ok(Map.of(
                "totalUsers",  userService.countAll(),
                "activeUsers", userService.countActive(),
                "totalTracks", trackService.countAllTracks(),
                "totalPlays",  trackService.sumAllPlayCounts()
        ));
    }

    // GET /api/admin/users?page=0
    @GetMapping("/users")
    public ResponseEntity<?> getUsers(
            @RequestParam(defaultValue = "0") int page) {

        Page<User> usersPage = userService.findAll(page);

        List<Map<String, Object>> users = usersPage.getContent().stream()
                .map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",           u.getId());
                    m.put("fullName",     u.getFullName());
                    m.put("email",        u.getEmail());
                    m.put("avatarUrl",    u.getAvatarUrl() != null ? u.getAvatarUrl() : "");
                    m.put("role",         u.getRole().name());
                    m.put("status",       u.getStatus().name());
                    m.put("trackCount",   u.getTracks().size());
                    m.put("createdAt",    u.getCreatedAt() != null ? u.getCreatedAt().toString() : "");
                    return m;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "users",       users,
                "totalPages",  usersPage.getTotalPages(),
                "totalElements", usersPage.getTotalElements(),
                "currentPage", page
        ));
    }

    // POST /api/admin/users/{id}/toggle-block
    @PostMapping("/users/{id}/toggle-block")
    public ResponseEntity<?> toggleBlock(@PathVariable Long id) {
        try {
            userService.toggleBlockUser(id);
            User user = userService.findById(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "status",  user.getStatus().name()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/admin/tracks?page=0
    @GetMapping("/tracks")
    public ResponseEntity<?> getTracks(
            @RequestParam(defaultValue = "0") int page) {

        Page<Track> tracksPage = trackService.findAllAdmin(page);

        List<Map<String, Object>> tracks = tracksPage.getContent().stream()
                .map(t -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",           t.getId());
                    m.put("title",        t.getTitle());
                    m.put("artist",       t.getArtist() != null ? t.getArtist() : "");
                    m.put("genre",        t.getGenre() != null ? t.getGenre() : "");
                    m.put("thumbnailUrl", t.getThumbnailUrl() != null ? t.getThumbnailUrl() : "");
                    m.put("fileUrl",      t.getFileUrl());
                    m.put("playCount",    t.getPlayCount());
                    m.put("likeCount",    t.getLikeCount());
                    m.put("hidden",       t.isHidden());
                    m.put("privacy",      t.getPrivacy().name());
                    m.put("createdAt",    t.getCreatedAt() != null ? t.getCreatedAt().toString() : "");
                    m.put("uploader", Map.of(
                            "id",       t.getUploader().getId(),
                            "fullName", t.getUploader().getFullName(),
                            "email",    t.getUploader().getEmail()
                    ));
                    return m;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "tracks",      tracks,
                "totalPages",  tracksPage.getTotalPages(),
                "totalElements", tracksPage.getTotalElements(),
                "currentPage", page
        ));
    }

    // POST /api/admin/tracks/{id}/toggle-hidden
    @PostMapping("/tracks/{id}/toggle-hidden")
    public ResponseEntity<?> toggleHidden(@PathVariable Long id) {
        try {
            trackService.toggleHidden(id);
            Track track = trackService.findById(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "hidden",  track.isHidden()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
