package com.soulsound.controller.api;

import com.soulsound.entity.Track;
import com.soulsound.entity.User;
import com.soulsound.service.TrackService;
import com.soulsound.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/search")
public class SearchApiController {

    private final TrackService trackService;
    private final UserService  userService;

    public SearchApiController(TrackService trackService, UserService userService) {
        this.trackService = trackService;
        this.userService  = userService;
    }

    // GET /api/search?q=...&genre=...&type=track|user&page=0
    @GetMapping
    public ResponseEntity<?> search(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(required = false, defaultValue = "") String genre,
            @RequestParam(required = false, defaultValue = "track") String type,
            @RequestParam(defaultValue = "0") int page) {

        if ("user".equals(type)) {
            Page<User> users = userService.searchByName(q, page);
            return ResponseEntity.ok(Map.of(
                    "users",       users.getContent().stream()
                            .map(u -> Map.of(
                                    "id",            u.getId(),
                                    "fullName",      u.getFullName(),
                                    "email",         u.getEmail(),
                                    "avatarUrl",     u.getAvatarUrl() != null ? u.getAvatarUrl() : "",
                                    "followerCount", u.getFollowerCount()
                            )).collect(Collectors.toList()),
                    "totalPages",  users.getTotalPages(),
                    "currentPage", page
            ));
        }

        // Track search
        Page<Track> tracks = trackService.searchByTitle(q, genre, page);
        return ResponseEntity.ok(Map.of(
                "tracks",      tracks.getContent().stream()
                        .map(t -> {
                            Map<String, Object> m = new LinkedHashMap<>();
                            m.put("id",           t.getId());
                            m.put("title",        t.getTitle());
                            m.put("artist",       t.getArtist());
                            m.put("genre",        t.getGenre() != null ? t.getGenre() : "");
                            m.put("thumbnailUrl", t.getThumbnailUrl() != null ? t.getThumbnailUrl() : "");
                            m.put("fileUrl",      t.getFileUrl());
                            m.put("playCount",    t.getPlayCount());
                            m.put("likeCount",    t.getLikeCount());
                            m.put("uploader",     Map.of(
                                    "id",       t.getUploader().getId(),
                                    "fullName", t.getUploader().getFullName(),
                                    "email",    t.getUploader().getEmail()
                            ));
                            return m;
                        }).collect(Collectors.toList()),
                "totalPages",  tracks.getTotalPages(),
                "currentPage", page
        ));
    }
}