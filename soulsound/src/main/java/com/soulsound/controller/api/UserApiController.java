package com.soulsound.controller.api;

import com.soulsound.dto.ProfileEditDto;
import com.soulsound.entity.*;
import java.util.Comparator;
import com.soulsound.repository.LikeRepository;
import com.soulsound.repository.UserRepository;
import com.soulsound.service.FileStorageService;
import com.soulsound.service.PlaylistService;
import com.soulsound.service.TrackService;
import com.soulsound.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserApiController {

    private final UserService        userService;
    private final TrackService       trackService;
    private final PlaylistService    playlistService;
    private final LikeRepository     likeRepo;
    private final UserRepository     userRepo;
    private final FileStorageService fileStorage;

    public UserApiController(UserService userService, TrackService trackService,
                             PlaylistService playlistService, LikeRepository likeRepo,
                             UserRepository userRepo, FileStorageService fileStorage) {
        this.userService     = userService;
        this.trackService    = trackService;
        this.playlistService = playlistService;
        this.likeRepo        = likeRepo;
        this.userRepo        = userRepo;
        this.fileStorage     = fileStorage;
    }

    // GET /api/users/profile/{email}
    @GetMapping("/profile/{email}")
    public ResponseEntity<?> getProfile(
            @PathVariable String email,
            @AuthenticationPrincipal UserDetails principal) {

        try {
            User profileUser = userService.findByEmail(email);
            boolean isOwner  = principal != null && principal.getUsername().equals(email);

            // Tracks
            List<Track> tracks = trackService.getTracksByUser(profileUser.getId())
                    .stream()
                    .filter(t -> isOwner || (t.getPrivacy() == TrackPrivacy.PUBLIC && !t.isHidden()))
                    .collect(Collectors.toList());

            // Liked
            List<Track> likedTracks = likeRepo.findByUserIdOrderByLikedAtDesc(profileUser.getId())
                    .stream().map(Like::getTrack)
                    .filter(t -> t != null && !t.isHidden())
                    .collect(Collectors.toList());

            // Playlists
            List<Playlist> playlists = playlistService.getByOwner(profileUser.getId());

            // Received comments: gom tất cả comments trên track của profileUser,
            // sort mới nhất trước, limit 20, kèm thông tin author + track
            List<Map<String, Object>> receivedComments = tracks.stream()
                    .flatMap(t -> t.getComments().stream())
                    .filter(c -> c != null && c.getAuthor() != null && c.getTrack() != null)
                    .sorted(Comparator.comparing(Comment::getCreatedAt).reversed())
                    .limit(20)
                    .map(c -> {
                        Map<String, Object> cm = new LinkedHashMap<>();
                        cm.put("id",        c.getId());
                        cm.put("content",   c.getContent());
                        cm.put("createdAt", c.getCreatedAt().toString());
                        cm.put("author", Map.of(
                                "id",        c.getAuthor().getId(),
                                "fullName",  c.getAuthor().getFullName(),
                                "email",     c.getAuthor().getEmail(),
                                "avatarUrl", c.getAuthor().getAvatarUrl() != null
                                             ? c.getAuthor().getAvatarUrl() : ""
                        ));
                        cm.put("track", Map.of(
                                "id",    c.getTrack().getId(),
                                "title", c.getTrack().getTitle()
                        ));
                        return cm;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("user",             buildFullUserDto(profileUser));
            res.put("tracks",           tracks.stream().map(t -> trackSummary(t)).collect(Collectors.toList()));
            res.put("likedTracks",      likedTracks.stream().map(t -> trackSummary(t)).collect(Collectors.toList()));
            res.put("playlists",        playlists.stream().map(p -> playlistSummary(p)).collect(Collectors.toList()));
            res.put("receivedComments", receivedComments);
            res.put("isOwner",          isOwner);

            if (principal != null && !isOwner) {
                User current = userService.findByEmail(principal.getUsername());
                res.put("isFollowing", userService.isFollowing(current.getId(), profileUser.getId()));
                res.put("likedTrackIds", userService.getLikedTrackIds(current.getId()));
            }

            return ResponseEntity.ok(res);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // PUT /api/users/profile  — edit profile
    @PutMapping("/profile")
    public ResponseEntity<?> editProfile(
            ProfileEditDto dto,
            @AuthenticationPrincipal UserDetails principal) {

        try {
            User user = userService.findByEmail(principal.getUsername());
            User updated = userService.updateProfile(user.getId(), dto);
            return ResponseEntity.ok(buildFullUserDto(updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PATCH /api/users/banner — cập nhật ảnh banner
    @PostMapping("/banner")
    public ResponseEntity<?> updateBanner(
            @RequestParam("bannerFile") MultipartFile bannerFile,
            @AuthenticationPrincipal UserDetails principal) {

        if (principal == null)
            return ResponseEntity.status(401).body(Map.of("error", "Chưa đăng nhập."));

        try {
            User user = userService.findByEmail(principal.getUsername());
            // Xóa banner cũ nếu có
            if (user.getBannerUrl() != null && !user.getBannerUrl().isBlank()) {
                fileStorage.deleteFile(user.getBannerUrl());
            }
            String newUrl = fileStorage.saveBanner(bannerFile);
            user.setBannerUrl(newUrl);
            userRepo.save(user);
            return ResponseEntity.ok(Map.of("bannerUrl", newUrl));
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
            return ResponseEntity.status(401).body(Map.of("error", "Chưa đăng nhập."));

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
                    .map(this::userSummary).collect(Collectors.toList()));
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    // GET /api/users/liked
    @GetMapping("/liked")
    public ResponseEntity<?> getLiked(@AuthenticationPrincipal UserDetails principal) {
        User user = userService.findByEmail(principal.getUsername());
        List<Track> tracks = likeRepo.findByUserIdOrderByLikedAtDesc(user.getId())
                .stream().map(Like::getTrack)
                .filter(t -> t != null && !t.isHidden())
                .collect(Collectors.toList());
        return ResponseEntity.ok(tracks.stream().map(this::trackSummary).collect(Collectors.toList()));
    }

    // GET /api/users/history?page=0
    @GetMapping("/history")
    public ResponseEntity<?> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @AuthenticationPrincipal UserDetails principal) {

        User user = userService.findByEmail(principal.getUsername());
        var histPage = trackService.getHistory(user.getId(), page);
        return ResponseEntity.ok(Map.of(
                "histories",   histPage.getContent().stream()
                        .filter(h -> h.getTrack() != null)
                        .map(h -> Map.of(
                                "id",          h.getId(),
                                "listenedAt",  h.getListenedAt().toString(),
                                "track",       trackSummary(h.getTrack())
                        )).collect(Collectors.toList()),
                "totalPages",  histPage.getTotalPages(),
                "currentPage", page
        ));
    }

    // GET /api/users/suggested
    @GetMapping("/suggested")
    public ResponseEntity<?> getSuggested(@AuthenticationPrincipal UserDetails principal) {
        if (principal == null) return ResponseEntity.ok(List.of());
        User user = userService.findByEmail(principal.getUsername());
        List<User> suggested = userRepo.findSuggestedUsers(user.getId(),
                org.springframework.data.domain.PageRequest.of(0, 5));
        return ResponseEntity.ok(suggested.stream().map(this::userSummary).collect(Collectors.toList()));
    }

    // ── DTO helpers ──────────────────────────────────────────────────

    private Map<String, Object> buildFullUserDto(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",            u.getId());
        m.put("fullName",      u.getFullName());
        m.put("email",         u.getEmail());
        m.put("avatarUrl",     u.getAvatarUrl()  != null ? u.getAvatarUrl()  : "");
        m.put("bannerUrl",     u.getBannerUrl()  != null ? u.getBannerUrl()  : "");
        m.put("bio",           u.getBio()        != null ? u.getBio()        : "");
        m.put("address",       u.getAddress()    != null ? u.getAddress()    : "");
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