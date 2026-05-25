package com.soulsound.controller.api;

import com.soulsound.entity.*;
import com.soulsound.repository.CommentRepository;
import com.soulsound.repository.TrackRepository;
import com.soulsound.service.NotificationService;
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

    private final UserService         userService;
    private final TrackService        trackService;
    private final NotificationService notifService;
    private final TrackRepository     trackRepo;
    private final CommentRepository   commentRepo;

    public AdminApiController(UserService userService,
                              TrackService trackService,
                              NotificationService notifService,
                              TrackRepository trackRepo,
                              CommentRepository commentRepo) {
        this.userService  = userService;
        this.trackService = trackService;
        this.notifService = notifService;
        this.trackRepo    = trackRepo;
        this.commentRepo  = commentRepo;
    }

    // ── GET /api/admin/dashboard ──────────────────────────────────
    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard() {
        long totalTracks    = trackRepo.count();
        long visibleTracks  = trackRepo.countByHiddenFalse();
        long totalPlays     = trackRepo.sumAllPlayCounts();
        long totalDuration  = trackRepo.findAll().stream()
                .mapToLong(t -> t.getDuration() != null ? t.getDuration() : 0).sum();

        // Top 10 tracks toàn hệ thống theo playCount
        List<Map<String, Object>> topTracks = trackRepo
                .findAll(PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "playCount")))
                .getContent().stream()
                .map(this::trackSummary)
                .collect(Collectors.toList());

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("totalUsers",    userService.countAll());
        res.put("activeUsers",   userService.countActive());
        res.put("totalTracks",   totalTracks);
        res.put("visibleTracks", visibleTracks);
        res.put("hiddenTracks",  totalTracks - visibleTracks);
        res.put("totalPlays",    totalPlays);
        res.put("totalDuration", totalDuration);
        res.put("topTracks",     topTracks);
        return ResponseEntity.ok(res);
    }

    // ── GET /api/admin/users?page=0&search= ──────────────────────
    @GetMapping("/users")
    public ResponseEntity<?> getUsers(
            @RequestParam(defaultValue = "0")  int    page,
            @RequestParam(defaultValue = "")   String search) {

        Page<User> usersPage = userService.findAll(page);
        List<Map<String, Object>> users = usersPage.getContent().stream()
                .filter(u -> search.isEmpty()
                        || u.getFullName().toLowerCase().contains(search.toLowerCase())
                        || u.getEmail().toLowerCase().contains(search.toLowerCase()))
                .map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",          u.getId());
                    m.put("fullName",    u.getFullName());
                    m.put("email",       u.getEmail());
                    m.put("avatarUrl",   u.getAvatarUrl()    != null ? u.getAvatarUrl()    : "");
                    m.put("role",        u.getRole().name());
                    m.put("status",      u.getStatus().name());
                    m.put("trackCount",  u.getTracks().size());
                    m.put("birthYear",   u.getBirthYear());
                    m.put("phoneNumber", u.getPhoneNumber()  != null ? u.getPhoneNumber()  : "");
                    m.put("address",     u.getAddress()      != null ? u.getAddress()      : "");
                    m.put("followerCount",  u.getFollowerCount());
                    m.put("followingCount", u.getFollowingCount());
                    m.put("createdAt",   u.getCreatedAt()    != null ? u.getCreatedAt().toString() : "");
                    return m;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "users",         users,
                "totalPages",    usersPage.getTotalPages(),
                "totalElements", usersPage.getTotalElements(),
                "currentPage",   page
        ));
    }

    // ── GET /api/admin/users/{id}/overview ───────────────────────
    @GetMapping("/users/{id}/overview")
    public ResponseEntity<?> getUserOverview(@PathVariable Long id) {
        try {
            User user = userService.findById(id);
            List<Track> tracks = trackRepo.findByUploaderIdOrderByCreatedAtDesc(user.getId());

            long totalDuration = tracks.stream()
                    .mapToLong(t -> t.getDuration() != null ? t.getDuration() : 0).sum();
            long totalPlays    = tracks.stream().mapToLong(t -> t.getPlayCount() != null ? t.getPlayCount() : 0).sum();
            long totalLikes    = tracks.stream().mapToLong(Track::getLikeCount).sum();

            // Xếp hạng theo playCount cao → thấp
            List<Map<String, Object>> ranked = tracks.stream()
                    .sorted(Comparator.comparingLong((Track t) -> t.getPlayCount() != null ? t.getPlayCount() : 0).reversed())
                    .map(this::trackSummary)
                    .collect(Collectors.toList());

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("user",          userSummary(user));
            res.put("trackCount",    tracks.size());
            res.put("totalDuration", totalDuration);
            res.put("totalPlays",    totalPlays);
            res.put("totalLikes",    totalLikes);
            res.put("rankedTracks",  ranked);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── POST /api/admin/users/{id}/toggle-block ──────────────────
    @PostMapping("/users/{id}/toggle-block")
    public ResponseEntity<?> toggleBlock(@PathVariable Long id) {
        try {
            userService.toggleBlockUser(id);
            User user = userService.findById(id);
            if (user.getStatus() == UserStatus.BLOCKED) {
                notifService.notifyAccountBanned(user);
            } else {
                notifService.notifyAccountUnbanned(user);
            }
            return ResponseEntity.ok(Map.of("success", true, "status", user.getStatus().name()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── POST /api/admin/users/{id}/message ───────────────────────
    @PostMapping("/users/{id}/message")
    public ResponseEntity<?> sendMessage(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            String msg = body.getOrDefault("message", "").trim();
            if (msg.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "Nội dung không được để trống."));
            User user = userService.findById(id);
            notifService.notifyAdminMessage(user, msg);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── GET /api/admin/tracks?page=0 ─────────────────────────────
    @GetMapping("/tracks")
    public ResponseEntity<?> getTracks(@RequestParam(defaultValue = "0") int page) {
        Page<Track> tracksPage = trackService.findAllAdmin(page);
        List<Map<String, Object>> tracks = tracksPage.getContent().stream()
                .map(t -> {
                    Map<String, Object> m = new LinkedHashMap<>(trackSummary(t));
                    m.put("fileUrl",   t.getFileUrl());
                    m.put("hidden",    t.isHidden());
                    m.put("privacy",   t.getPrivacy().name());
                    m.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : "");
                    m.put("uploader",  Map.of(
                            "id",       t.getUploader().getId(),
                            "fullName", t.getUploader().getFullName(),
                            "email",    t.getUploader().getEmail()
                    ));
                    return m;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "tracks",        tracks,
                "totalPages",    tracksPage.getTotalPages(),
                "totalElements", tracksPage.getTotalElements(),
                "currentPage",   page
        ));
    }

    // ── GET /api/admin/tracks/{id}/comments ──────────────────────
    @GetMapping("/tracks/{id}/comments")
    public ResponseEntity<?> getTrackComments(@PathVariable Long id) {
        try {
            Track track = trackService.findById(id);
            List<Map<String, Object>> comments = commentRepo
                    .findByTrackIdAndParentIsNullOrderByCreatedAtAsc(id)
                    .stream()
                    .map(c -> {
                        Map<String, Object> cm = new LinkedHashMap<>();
                        cm.put("id",        c.getId());
                        cm.put("content",   c.getContent());
                        cm.put("createdAt", c.getCreatedAt().toString());
                        cm.put("author", Map.of(
                                "id",        c.getAuthor().getId(),
                                "fullName",  c.getAuthor().getFullName(),
                                "email",     c.getAuthor().getEmail(),
                                "avatarUrl", c.getAuthor().getAvatarUrl() != null ? c.getAuthor().getAvatarUrl() : ""
                        ));
                        // Include replies
                        cm.put("replies", c.getReplies().stream().map(r -> Map.of(
                                "id",        r.getId(),
                                "content",   r.getContent(),
                                "createdAt", r.getCreatedAt().toString(),
                                "author", Map.of(
                                        "fullName",  r.getAuthor().getFullName(),
                                        "avatarUrl", r.getAuthor().getAvatarUrl() != null ? r.getAuthor().getAvatarUrl() : ""
                                )
                        )).collect(Collectors.toList()));
                        return cm;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                    "trackId",    id,
                    "trackTitle", track.getTitle(),
                    "comments",   comments,
                    "total",      comments.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── POST /api/admin/tracks/{id}/toggle-hidden ────────────────
    @PostMapping("/tracks/{id}/toggle-hidden")
    public ResponseEntity<?> toggleHidden(@PathVariable Long id) {
        try {
            trackService.toggleHidden(id);
            Track track = trackService.findById(id);
            if (track.isHidden()) {
                notifService.notifyTrackHidden(track);
            } else {
                notifService.notifyTrackUnhidden(track);
            }
            return ResponseEntity.ok(Map.of("success", true, "hidden", track.isHidden()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Helpers ───────────────────────────────────────────────────

    private Map<String, Object> trackSummary(Track t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",           t.getId());
        m.put("title",        t.getTitle());
        m.put("artist",       t.getArtist()       != null ? t.getArtist()       : "");
        m.put("genre",        t.getGenre()        != null ? t.getGenre()        : "");
        m.put("thumbnailUrl", t.getThumbnailUrl() != null ? t.getThumbnailUrl() : "");
        m.put("playCount",    t.getPlayCount()    != null ? t.getPlayCount()    : 0);
        m.put("likeCount",    t.getLikeCount());
        m.put("duration",     t.getDuration()     != null ? t.getDuration()     : 0);
        m.put("hidden",       t.isHidden());
        return m;
    }

    private Map<String, Object> userSummary(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",          u.getId());
        m.put("fullName",    u.getFullName());
        m.put("email",       u.getEmail());
        m.put("avatarUrl",   u.getAvatarUrl()    != null ? u.getAvatarUrl()    : "");
        m.put("status",      u.getStatus().name());
        m.put("role",        u.getRole().name());
        m.put("birthYear",   u.getBirthYear());
        m.put("phoneNumber", u.getPhoneNumber()  != null ? u.getPhoneNumber()  : "");
        m.put("address",     u.getAddress()      != null ? u.getAddress()      : "");
        m.put("followerCount",  u.getFollowerCount());
        m.put("followingCount", u.getFollowingCount());
        m.put("createdAt",   u.getCreatedAt()    != null ? u.getCreatedAt().toString() : "");
        return m;
    }
}