package com.soulsound.controller.api;

import com.soulsound.entity.Playlist;
import com.soulsound.entity.User;
import com.soulsound.service.FileStorageService;
import com.soulsound.service.PlaylistService;
import com.soulsound.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/playlists")
public class PlaylistApiController {

    private final PlaylistService    playlistService;
    private final UserService        userService;
    private final FileStorageService fileStorageService;

    public PlaylistApiController(PlaylistService playlistService,
                                 UserService userService,
                                 FileStorageService fileStorageService) {
        this.playlistService    = playlistService;
        this.userService        = userService;
        this.fileStorageService = fileStorageService;
    }

    // GET /api/playlists
    @GetMapping
    public ResponseEntity<?> getMyPlaylists(@AuthenticationPrincipal UserDetails principal) {
        User user = userService.findByEmail(principal.getUsername());
        List<Playlist> playlists = playlistService.getByOwner(user.getId());
        return ResponseEntity.ok(playlists.stream().map(this::playlistDto).collect(Collectors.toList()));
    }

    // GET /api/playlists/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getPlaylist(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        try {
            Playlist pl = playlistService.findById(id);
            Map<String, Object> dto = playlistDetailDto(pl);
            if (principal != null) {
                User user = userService.findByEmail(principal.getUsername());
                dto.put("isOwner", pl.getOwner().getId().equals(user.getId()));
            } else {
                dto.put("isOwner", false);
            }
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // POST /api/playlists
    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails principal) {
        try {
            User user = userService.findByEmail(principal.getUsername());
            Playlist pl = playlistService.create(body.get("name"), body.get("description"), user.getId());
            return ResponseEntity.ok(playlistDto(pl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT /api/playlists/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails principal) {
        try {
            User user = userService.findByEmail(principal.getUsername());
            playlistService.update(id, body.get("name"), body.get("description"), user.getId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /api/playlists/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        try {
            User user = userService.findByEmail(principal.getUsername());
            playlistService.delete(id, user.getId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/playlists/{id}/tracks/{trackId}
    @PostMapping("/{id}/tracks/{trackId}")
    public ResponseEntity<?> addTrack(
            @PathVariable Long id,
            @PathVariable Long trackId,
            @AuthenticationPrincipal UserDetails principal) {
        try {
            User user = userService.findByEmail(principal.getUsername());
            Playlist pl = playlistService.addTrack(id, trackId, user.getId());
            return ResponseEntity.ok(Map.of("success", true, "trackCount", pl.getTrackCount()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /api/playlists/{id}/tracks/{trackId}
    @DeleteMapping("/{id}/tracks/{trackId}")
    public ResponseEntity<?> removeTrack(
            @PathVariable Long id,
            @PathVariable Long trackId,
            @AuthenticationPrincipal UserDetails principal) {
        try {
            User user = userService.findByEmail(principal.getUsername());
            playlistService.removeTrack(id, trackId, user.getId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT /api/playlists/{id}/cover  — multipart/form-data, field "cover"
    @PutMapping("/{id}/cover")
    public ResponseEntity<?> updateCover(
            @PathVariable Long id,
            @RequestParam("cover") MultipartFile cover,
            @AuthenticationPrincipal UserDetails principal) {
        try {
            User user = userService.findByEmail(principal.getUsername());
            String url = fileStorageService.savePlaylistCover(cover);
            // Xóa ảnh cũ nếu có
            Playlist before = playlistService.findById(id);
            if (before.getCoverUrl() != null) fileStorageService.deleteFile(before.getCoverUrl());
            Playlist pl = playlistService.updateCover(id, url, user.getId());
            return ResponseEntity.ok(Map.of("success", true, "coverUrl", pl.getCoverUrl()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /api/playlists/{id}/cover
    @DeleteMapping("/{id}/cover")
    public ResponseEntity<?> deleteCover(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        try {
            User user = userService.findByEmail(principal.getUsername());
            Playlist before = playlistService.findById(id);
            if (before.getCoverUrl() != null) fileStorageService.deleteFile(before.getCoverUrl());
            playlistService.deleteCover(id, user.getId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT /api/playlists/{id}/reorder — body: { "trackIds": [3, 1, 2] }
    @PutMapping("/{id}/reorder")
    public ResponseEntity<?> reorder(
            @PathVariable Long id,
            @RequestBody Map<String, List<Long>> body,
            @AuthenticationPrincipal UserDetails principal) {
        try {
            User user = userService.findByEmail(principal.getUsername());
            playlistService.reorder(id, body.get("trackIds"), user.getId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── DTOs ───────────────────────────────────────────────────────

    private Map<String, Object> playlistDto(Playlist p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",          p.getId());
        m.put("name",        p.getName());
        m.put("description", p.getDescription() != null ? p.getDescription() : "");
        m.put("trackCount",  p.getTrackCount());
        m.put("coverUrl",    p.getCoverUrl() != null ? p.getCoverUrl() : "");
        return m;
    }

    private Map<String, Object> playlistDetailDto(Playlist p) {
        Map<String, Object> m = new LinkedHashMap<>(playlistDto(p));
        m.put("tracks", p.getTracks().stream().map(t -> {
            Map<String, Object> tm = new LinkedHashMap<>();
            tm.put("id",           t.getId());
            tm.put("title",        t.getTitle());
            tm.put("artist",       t.getArtist() != null ? t.getArtist() : "");
            tm.put("thumbnailUrl", t.getThumbnailUrl() != null ? t.getThumbnailUrl() : "");
            tm.put("fileUrl",      t.getFileUrl());
            tm.put("playCount",    t.getPlayCount());
            tm.put("duration",     t.getDuration() != null ? t.getDuration() : 0);
            return tm;
        }).collect(Collectors.toList()));
        m.put("owner", Map.of(
                "id",       p.getOwner().getId(),
                "fullName", p.getOwner().getFullName(),
                "email",    p.getOwner().getEmail()
        ));
        return m;
    }
}
