package com.soulsound.controller.api;

import com.soulsound.dto.ProfileEditDto;
import com.soulsound.entity.*;
import java.util.Comparator;
import com.soulsound.repository.CommentRepository;
import com.soulsound.repository.LikeRepository;
import com.soulsound.repository.ListeningHistoryRepository;
import com.soulsound.repository.UserRepository;
import com.soulsound.service.FileStorageService;
import com.soulsound.service.PlaylistService;
import com.soulsound.service.TrackService;
import com.soulsound.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserApiController {

    private final UserService        userService;
    private final TrackService       trackService;
    private final PlaylistService    playlistService;
    private final LikeRepository     likeRepo;
    private final CommentRepository  commentRepo;
    private final UserRepository     userRepo;
    private final FileStorageService         fileStorage;
    private final ListeningHistoryRepository historyRepo;

    public UserApiController(UserService userService, TrackService trackService,
                             PlaylistService playlistService, LikeRepository likeRepo,
                             CommentRepository commentRepo,
                             UserRepository userRepo, FileStorageService fileStorage,
                             ListeningHistoryRepository historyRepo) {
        this.userService     = userService;
        this.trackService    = trackService;
        this.playlistService = playlistService;
        this.likeRepo        = likeRepo;
        this.commentRepo     = commentRepo;
        this.userRepo        = userRepo;
        this.fileStorage     = fileStorage;
        this.historyRepo     = historyRepo;
    }

    // GET /api/users/profile/{email}
    @GetMapping("/profile/{email}")
    public ResponseEntity<?> getProfile(
            @PathVariable String email,
            @AuthenticationPrincipal UserDetails principal) {

        try {
            User profileUser = userService.findByEmail(email);
            boolean isOwner  = principal != null && principal.getUsername().equals(email);

            List<Track> tracks = trackService.getTracksByUser(profileUser.getId())
                    .stream()
                    .filter(t -> isOwner || (!t.isHidden() && t.getPrivacy() == TrackPrivacy.PUBLIC))
                    .collect(Collectors.toList());

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("user", buildFullUserDto(profileUser));
            res.put("tracks", tracks.stream().map(this::trackSummary).collect(Collectors.toList()));
            res.put("isOwner", isOwner);

            // ── Liked tracks ──────────────────────────────────────────
            List<Map<String, Object>> likedTracks = likeRepo
                    .findByUserIdOrderByLikedAtDesc(profileUser.getId())
                    .stream()
                    .map(l -> trackSummary(l.getTrack()))
                    .collect(Collectors.toList());
            res.put("likedTracks", likedTracks);

            // ── Playlists ─────────────────────────────────────────────
            List<Map<String, Object>> playlists = playlistService
                    .getByOwner(profileUser.getId())
                    .stream()
                    .map(this::playlistSummary)
                    .collect(Collectors.toList());
            res.put("playlists", playlists);

            // ── Received comments ─────────────────────────────────────
            List<Map<String, Object>> receivedComments = commentRepo
                    .findReceivedCommentsByUploaderId(profileUser.getId())
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
                        cm.put("track", Map.of(
                                "id",    c.getTrack().getId(),
                                "title", c.getTrack().getTitle()
                        ));
                        return cm;
                    })
                    .collect(Collectors.toList());
            res.put("receivedComments", receivedComments);

            if (principal != null) {
                User current = userService.findByEmail(principal.getUsername());
                res.put("isFollowing", userService.isFollowing(current.getId(), profileUser.getId()));
            } else {
                res.put("isFollowing", false);
            }

            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // PUT /api/users/profile
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @ModelAttribute ProfileEditDto dto,
            @AuthenticationPrincipal UserDetails principal) {

        if (principal == null)
            return ResponseEntity.status(401).body(Map.of("error", "Chua dang nhap."));

        try {
            User current = userService.findByEmail(principal.getUsername());
            User updated = userService.updateProfile(current.getId(), dto);
            return ResponseEntity.ok(buildFullUserDto(updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/users/banner
    @PostMapping("/banner")
    public ResponseEntity<?> updateBanner(
            @RequestParam("bannerFile") MultipartFile bannerFile,
            @AuthenticationPrincipal UserDetails principal) {

        if (principal == null)
            return ResponseEntity.status(401).body(Map.of("error", "Chua dang nhap."));

        try {
            User current = userService.findByEmail(principal.getUsername());
            if (current.getBannerUrl() != null) fileStorage.deleteFile(current.getBannerUrl());
            String url = fileStorage.saveBanner(bannerFile);
            current.setBannerUrl(url);
            userRepo.save(current);
            return ResponseEntity.ok(Map.of("bannerUrl", url));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/users/{id}/follow
    @PostMapping("/{id}/follow")
    public ResponseEntity<?> follow(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {

        if (principal == null)
            return ResponseEntity.status(401).body(Map.of("error", "Chua dang nhap."));

        User current    = userService.findByEmail(principal.getUsername());
        boolean following = userService.toggleFollow(current.getId(), id);
        User target     = userService.findById(id);

        return ResponseEntity.ok(Map.of(
                "following",     following,
                "followerCount", target.getFollowerCount()
        ));
    }

    // GET /api/users/{id}/followers
    @GetMapping("/{id}/followers")
    public ResponseEntity<?> getFollowers(@PathVariable Long id) {
        try {
            User user = userRepo.findByIdWithFollowers(id).orElseThrow();
            return ResponseEntity.ok(user.getFollowers().stream()
                    .map(this::userSummary).collect(Collectors.toList()));
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    // GET /api/users/{id}/following
    @GetMapping("/{id}/following")
    public ResponseEntity<?> getFollowing(@PathVariable Long id) {
        try {
            User user = userRepo.findByIdWithFollowing(id).orElseThrow();
            return ResponseEntity.ok(user.getFollowing().stream()
                    .sorted(Comparator.comparing(User::getFullName))
                    .map(this::userSummary).collect(Collectors.toList()));
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    // GET /api/users/liked
    @GetMapping("/liked")
    public ResponseEntity<?> getLiked(@AuthenticationPrincipal UserDetails principal) {
        if (principal == null)
            return ResponseEntity.status(401).body(Map.of("error", "Chua dang nhap."));

        User current = userService.findByEmail(principal.getUsername());
        List<Map<String, Object>> liked = likeRepo.findByUserIdOrderByLikedAtDesc(current.getId())
                .stream()
                .map(l -> trackSummary(l.getTrack()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(liked);
    }

    // GET /api/users/history
    @GetMapping("/history")
    public ResponseEntity<?> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @AuthenticationPrincipal UserDetails principal) {

        if (principal == null)
            return ResponseEntity.status(401).body(Map.of("error", "Chua dang nhap."));

        User current = userService.findByEmail(principal.getUsername());
        Page<?> histPage = trackService.getHistory(current.getId(), page);

        List<Map<String, Object>> histories = histPage.getContent().stream()
                .map(obj -> {
                    ListeningHistory h = (ListeningHistory) obj;
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("track",      trackSummary(h.getTrack()));
                    m.put("listenedAt", h.getListenedAt() != null ? h.getListenedAt().toString() : "");
                    return m;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "histories",   histories,
                "totalPages",  histPage.getTotalPages(),
                "currentPage", page
        ));
    }

    // GET /api/users/suggested
    @GetMapping("/suggested")
    public ResponseEntity<?> getSuggested(@AuthenticationPrincipal UserDetails principal) {
        try {
            if (principal == null) return ResponseEntity.ok(List.of());

            User user = userService.findByEmail(principal.getUsername());

            List<User> suggested = userRepo.findSuggestedUsers(
                    user.getId(),
                    PageRequest.of(0, 5)
            );

            Set<Long> followingIds = new HashSet<>(userRepo.findFollowingIds(user.getId()));
            return ResponseEntity.ok(
                    suggested.stream()
                            .map(u -> userSummaryWithFollowingIds(u, followingIds))
                            .collect(Collectors.toList())
            );

        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    // ── GET /api/users/overview  (7-day widget + full overview page) ──
    @GetMapping("/overview")
    public ResponseEntity<?> getOverview(
            @RequestParam(defaultValue = "7") int days,
            @AuthenticationPrincipal UserDetails principal) {

        if (principal == null)
            return ResponseEntity.status(401).body(Map.of("error", "Chua dang nhap."));

        try {
            User user = userService.findByEmail(principal.getUsername());
            Long uid  = user.getId();

            // Tong luot nghe tat ca track
            long totalPlays    = trackService.sumPlayCountByUser(uid);
            long totalLikes    = likeRepo.countLikesByUploaderId(uid);
            long totalComments = commentRepo.countCommentsByUploaderId(uid);

            // Top 5 tracks (30 ngay)
            List<Track> topTracks = trackService.getTopTracksByUser(uid, 5);
            List<Map<String, Object>> topTracksDto = topTracks.stream()
                    .map(t -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("id",           t.getId());
                        m.put("title",        t.getTitle());
                        m.put("artist",       t.getArtist() != null ? t.getArtist() : "");
                        m.put("thumbnailUrl", t.getThumbnailUrl() != null ? t.getThumbnailUrl() : "");
                        m.put("playCount",    t.getPlayCount());
                        m.put("likeCount",    t.getLikeCount());
                        m.put("genre",        t.getGenre() != null ? t.getGenre() : "");
                        return m;
                    })
                    .collect(Collectors.toList());

            // Top 5 listeners (30 ngay) — tính theo lượt nghe thực tế
            LocalDateTime since30 = LocalDateTime.now().minusDays(30);
            List<Object[]> topListenersRaw = historyRepo.findTopListenersByUploaderId(
                    uid, since30, PageRequest.of(0, 5));
            List<Map<String, Object>> topListenersDto = topListenersRaw.stream()
                    .map(row -> {
                        User u   = (User) row[0];
                        Long cnt = (Long) row[1];
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("id",         u.getId());
                        m.put("fullName",    u.getFullName());
                        m.put("email",       u.getEmail());
                        m.put("avatarUrl",   u.getAvatarUrl() != null ? u.getAvatarUrl() : "");
                        m.put("listenCount", cnt);
                        return m;
                    })
                    .collect(Collectors.toList());

            // Thong ke theo ngay (chart data): play theo ngay dua tren createdAt track (approximation)
            List<Track> allTracks = trackService.getTracksByUser(uid);

            // Daily chart series
            LocalDateTime since = LocalDateTime.now().minusDays(days);
            List<Object[]> dailyPlaysRaw    = historyRepo.countDailyPlaysByUploaderId(uid, since);
            List<Object[]> dailyLikesRaw    = likeRepo.countDailyLikesByUploaderId(uid, since);
            List<Object[]> dailyCommentsRaw = commentRepo.countDailyCommentsByUploaderId(uid, since);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("fullName",      user.getFullName());
            result.put("totalPlays",    totalPlays);
            result.put("totalLikes",    totalLikes);
            result.put("totalComments", totalComments);
            result.put("totalTracks",   allTracks.size());
            result.put("topTracks",     topTracksDto);
            result.put("topListeners",  topListenersDto);
            result.put("dailyPlays",    buildDailySeries(dailyPlaysRaw, days));
            result.put("dailyLikes",    buildDailySeries(dailyLikesRaw, days));
            result.put("dailyComments", buildDailySeries(dailyCommentsRaw, days));
            result.put("days",          days);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    // ── Build daily time series (fills missing days with 0) ──────────
    private List<Map<String, Object>> buildDailySeries(List<Object[]> raw, int days) {
        Map<String, Long> lookup = new LinkedHashMap<>();
        for (Object[] row : raw) {
            // row[0] is LocalDateTime — truncate to date string
            String dateStr = row[0].toString().substring(0, 10);
            Long count = row[1] instanceof Long ? (Long) row[1] : ((Number) row[1]).longValue();
            lookup.merge(dateStr, count, Long::sum);
        }
        List<Map<String, Object>> series = new ArrayList<>();
        java.time.LocalDate today = java.time.LocalDate.now();
        for (int i = days - 1; i >= 0; i--) {
            java.time.LocalDate d = today.minusDays(i);
            String key = d.toString();
            Map<String, Object> pt = new LinkedHashMap<>();
            pt.put("date",  key);
            pt.put("label", d.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd")));
            pt.put("count", lookup.getOrDefault(key, 0L));
            series.add(pt);
        }
        return series;
    }

    // ── DTO helpers ──────────────────────────────────────────────────

    private Map<String, Object> buildFullUserDto(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",            u.getId());
        m.put("fullName",      u.getFullName());
        m.put("email",         u.getEmail());
        m.put("avatarUrl",     u.getAvatarUrl()   != null ? u.getAvatarUrl()   : "");
        m.put("bannerUrl",     u.getBannerUrl()   != null ? u.getBannerUrl()   : "");
        m.put("bio",           u.getBio()         != null ? u.getBio()         : "");
        m.put("address",       u.getAddress()     != null ? u.getAddress()     : "");
        m.put("birthYear",     u.getBirthYear());
        m.put("phoneNumber",   u.getPhoneNumber() != null ? u.getPhoneNumber() : "");
        m.put("role",          u.getRole().name());
        m.put("followerCount", u.getFollowerCount());
        m.put("followingCount",u.getFollowingCount());
        return m;
    }

    private Map<String, Object> userSummary(User u) {
        return Map.of(
                "id",            u.getId(),
                "fullName",      u.getFullName(),
                "email",         u.getEmail(),
                "avatarUrl",     u.getAvatarUrl() != null ? u.getAvatarUrl() : "",
                "followerCount", u.getFollowerCount()
        );
    }


    private Map<String, Object> userSummaryWithFollowingIds(User u, Set<Long> followingIds) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",            u.getId());
        m.put("fullName",      u.getFullName());
        m.put("email",         u.getEmail());
        m.put("avatarUrl",     u.getAvatarUrl() != null ? u.getAvatarUrl() : "");
        m.put("followerCount", u.getFollowerCount());
        m.put("following",     followingIds.contains(u.getId()));
        return m;
    }

    private Map<String, Object> userSummaryWithFollowing(User u, User currentUser) {
        boolean isFollowing = userService.isFollowing(currentUser.getId(), u.getId());
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",            u.getId());
        m.put("fullName",      u.getFullName());
        m.put("email",         u.getEmail());
        m.put("avatarUrl",     u.getAvatarUrl() != null ? u.getAvatarUrl() : "");
        m.put("followerCount", u.getFollowerCount());
        m.put("following",     isFollowing);
        return m;
    }

    private Map<String, Object> trackSummary(Track t) {
        return Map.of(
                "id",           t.getId(),
                "title",        t.getTitle(),
                "artist",       t.getArtist() != null ? t.getArtist() : "",
                "thumbnailUrl", t.getThumbnailUrl() != null ? t.getThumbnailUrl() : "",
                "fileUrl",      t.getFileUrl(),
                "genre",        t.getGenre() != null ? t.getGenre() : "",
                "playCount",    t.getPlayCount(),
                "likeCount",    t.getLikeCount(),
                "uploader",     Map.of("id", t.getUploader().getId(),
                        "fullName", t.getUploader().getFullName(),
                        "email", t.getUploader().getEmail())
        );
    }

    private Map<String, Object> playlistSummary(Playlist p) {
        return Map.of(
                "id",         p.getId(),
                "name",       p.getName(),
                "trackCount", p.getTrackCount()
        );
    }
}