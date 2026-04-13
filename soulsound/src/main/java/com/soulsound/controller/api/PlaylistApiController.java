package com.soulsound.controller.api;

import com.soulsound.entity.Playlist;
import com.soulsound.entity.User;
import com.soulsound.service.PlaylistService;
import com.soulsound.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/playlists")
public class PlaylistApiController {

    private final PlaylistService playlistService;
    private final UserService     userService;

    public PlaylistApiController(PlaylistService playlistService, UserService userService) {
        this.playlistService = playlistService;
        this.userService     = userService;
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

    private Map<String, Object> playlistDto(Playlist p) {
        return Map.of(
                "id",         p.getId(),
                "name",       p.getName(),
                "description", p.getDescription() != null ? p.getDescription() : "",
                "trackCount", p.getTrackCount()
        );
    }

    private Map<String, Object> playlistDetailDto(Playlist p) {
        java.util.Map<String, Object> m = new java.util.LinkedHashMap<>(playlistDto(p));
        m.put("tracks", p.getTracks().stream().map(t -> Map.of(
                "id",           t.getId(),
                "title",        t.getTitle(),
                "artist",       t.getArtist(),
                "thumbnailUrl", t.getThumbnailUrl() != null ? t.getThumbnailUrl() : "",
                "fileUrl",      t.getFileUrl(),
                "playCount",    t.getPlayCount()
        )).collect(Collectors.toList()));
        m.put("owner", Map.of(
                "id",       p.getOwner().getId(),
                "fullName", p.getOwner().getFullName(),
                "email",    p.getOwner().getEmail()
        ));
        return m;
    }
}