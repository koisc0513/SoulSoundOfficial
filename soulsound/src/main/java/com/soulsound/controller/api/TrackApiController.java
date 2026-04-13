package com.soulsound.controller.api;

import com.soulsound.dto.TrackEditDto;
import com.soulsound.dto.TrackUploadDto;
import com.soulsound.entity.*;
import com.soulsound.service.TrackService;
import com.soulsound.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tracks")
public class TrackApiController {

    private final TrackService trackService;
    private final UserService  userService;

    public TrackApiController(TrackService trackService, UserService userService) {
        this.trackService = trackService;
        this.userService  = userService;
    }

    // GET /api/tracks?page=0
    @GetMapping
    public ResponseEntity<?> getFeed(
            @RequestParam(defaultValue = "0") int page) {
        Page<Track> trackPage = trackService.getPublicFeed(page);
        return ResponseEntity.ok(Map.of(
                "tracks",      trackPage.getContent().stream().map(this::trackDto).collect(Collectors.toList()),
                "totalPages",  trackPage.getTotalPages(),
                "totalElements", trackPage.getTotalElements(),
                "currentPage", page
        ));
    }

    // GET /api/tracks/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getTrack(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {

        try {
            Track track = trackService.findById(id);

            if ((track.getPrivacy() == TrackPrivacy.PRIVATE || track.isHidden())
                    && principal == null) {
                return ResponseEntity.status(403).body(Map.of("error", "Không có quyền xem."));
            }

            Map<String, Object> dto = trackDetailDto(track);

            if (principal != null) {
                User user = userService.findByEmail(principal.getUsername());
                dto.put("isLiked",     userService.getLikedTrackIds(user.getId()).contains(id));
                dto.put("isFollowing", userService.isFollowing(user.getId(), track.getUploader().getId()));
                dto.put("isOwner",     track.getUploader().getId().equals(user.getId()));
            }

            return ResponseEntity.ok(dto);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // POST /api/tracks/upload  (multipart)
    @PostMapping("/upload")
    public ResponseEntity<?> upload(
            TrackUploadDto dto,
            @AuthenticationPrincipal UserDetails principal) {

        try {
            User uploader = userService.findByEmail(principal.getUsername());
            Track saved   = trackService.upload(dto, uploader.getId());
            return ResponseEntity.ok(trackDto(saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT /api/tracks/{id}  (multipart)
    @PutMapping("/{id}")
    public ResponseEntity<?> edit(
            @PathVariable Long id,
            TrackEditDto dto,
            @AuthenticationPrincipal UserDetails principal) {

        try {
            User user = userService.findByEmail(principal.getUsername());
            Track updated = trackService.edit(id, dto, user.getId());
            return ResponseEntity.ok(trackDto(updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /api/tracks/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {

        try {
            User user = userService.findByEmail(principal.getUsername());
            trackService.delete(id, user.getId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/tracks/{id}/play
    @PostMapping("/{id}/play")
    public ResponseEntity<?> play(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {

        trackService.incrementPlayCount(id);
        if (principal != null) {
            User user = userService.findByEmail(principal.getUsername());
            trackService.recordListeningHistory(id, user.getId());
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    // POST /api/tracks/{id}/like
    @PostMapping("/{id}/like")
    public ResponseEntity<?> like(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {

        if (principal == null)
            return ResponseEntity.status(401).body(Map.of("error", "Vui lòng đăng nhập."));

        User user = userService.findByEmail(principal.getUsername());
        return ResponseEntity.ok(trackService.toggleLike(id, user.getId()));
    }

    // POST /api/tracks/{id}/comments
    @PostMapping("/{id}/comments")
    public ResponseEntity<?> addComment(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails principal) {

        try {
            User user    = userService.findByEmail(principal.getUsername());
            Comment c    = trackService.addComment(id, user.getId(), body.get("content"));
            return ResponseEntity.ok(commentDto(c));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /api/tracks/comments/{commentId}
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails principal) {

        try {
            User user = userService.findByEmail(principal.getUsername());
            trackService.deleteComment(commentId, user.getId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── DTO helpers ──────────────────────────────────────────────────

    public Map<String, Object> trackDto(Track t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",           t.getId());
        m.put("title",        t.getTitle());
        m.put("artist",       t.getArtist());
        m.put("genre",        t.getGenre());
        m.put("description",  t.getDescription() != null ? t.getDescription() : "");
        m.put("fileUrl",      t.getFileUrl());
        m.put("thumbnailUrl", t.getThumbnailUrl() != null ? t.getThumbnailUrl() : "");
        m.put("privacy",      t.getPrivacy().name());
        m.put("playCount",    t.getPlayCount());
        m.put("likeCount",    t.getLikeCount());
        m.put("createdAt",    t.getCreatedAt() != null ? t.getCreatedAt().toString() : "");
        // Uploader summary
        User u = t.getUploader();
        m.put("uploader", Map.of(
                "id",        u.getId(),
                "fullName",  u.getFullName(),
                "email",     u.getEmail(),
                "avatarUrl", u.getAvatarUrl() != null ? u.getAvatarUrl() : ""
        ));
        return m;
    }

    private Map<String, Object> trackDetailDto(Track t) {
        Map<String, Object> m = new LinkedHashMap<>(trackDto(t));
        // Include comments
        m.put("comments", t.getComments().stream()
                .sorted(Comparator.comparing(Comment::getCreatedAt))
                .map(this::commentDto)
                .collect(Collectors.toList()));
        return m;
    }

    private Map<String, Object> commentDto(Comment c) {
        return Map.of(
                "id",        c.getId(),
                "content",   c.getContent(),
                "createdAt", c.getCreatedAt().toString(),
                "author", Map.of(
                        "id",        c.getAuthor().getId(),
                        "fullName",  c.getAuthor().getFullName(),
                        "email",     c.getAuthor().getEmail(),
                        "avatarUrl", c.getAuthor().getAvatarUrl() != null ? c.getAuthor().getAvatarUrl() : ""
                )
        );
    }
}