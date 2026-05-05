package com.soulsound.controller.api;

import com.soulsound.entity.Notification;
import com.soulsound.entity.User;
import com.soulsound.service.NotificationService;
import com.soulsound.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
public class NotificationApiController {

    private final NotificationService notifService;
    private final UserService         userService;

    public NotificationApiController(NotificationService notifService, UserService userService) {
        this.notifService = notifService;
        this.userService  = userService;
    }

    // GET /api/notifications?page=0
    @GetMapping
    public ResponseEntity<?> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @AuthenticationPrincipal UserDetails principal) {

        if (principal == null)
            return ResponseEntity.status(401).body(Map.of("error", "Vui lòng đăng nhập."));

        User user = userService.findByEmail(principal.getUsername());
        Page<Notification> notifPage = notifService.getNotifications(user.getId(), page);

        return ResponseEntity.ok(Map.of(
                "notifications", notifPage.getContent().stream()
                        .map(this::toDto)
                        .collect(Collectors.toList()),
                "unreadCount",  notifService.countUnread(user.getId()),
                "totalPages",   notifPage.getTotalPages(),
                "currentPage",  page
        ));
    }

    // GET /api/notifications/unread-count
    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(
            @AuthenticationPrincipal UserDetails principal) {

        if (principal == null)
            return ResponseEntity.status(401).body(Map.of("error", "Vui lòng đăng nhập."));

        User user = userService.findByEmail(principal.getUsername());
        return ResponseEntity.ok(Map.of("count", notifService.countUnread(user.getId())));
    }

    // POST /api/notifications/read-all
    @PostMapping("/read-all")
    public ResponseEntity<?> markAllRead(
            @AuthenticationPrincipal UserDetails principal) {

        if (principal == null)
            return ResponseEntity.status(401).body(Map.of("error", "Vui lòng đăng nhập."));

        User user = userService.findByEmail(principal.getUsername());
        notifService.markAllRead(user.getId());
        return ResponseEntity.ok(Map.of("success", true));
    }

    // POST /api/notifications/{id}/read
    @PostMapping("/{id}/read")
    public ResponseEntity<?> markOneRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {

        if (principal == null)
            return ResponseEntity.status(401).body(Map.of("error", "Vui lòng đăng nhập."));

        User user = userService.findByEmail(principal.getUsername());
        notifService.markOneRead(id, user.getId());
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ── DTO helper ─────────────────────────────────────────────────

    private Map<String, Object> toDto(Notification n) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",               n.getId());
        m.put("type",             n.getType().name());
        m.put("message",          n.getMessage());
        m.put("read",             n.isRead());
        m.put("createdAt",        n.getCreatedAt() != null ? n.getCreatedAt().toString() : "");
        m.put("actorName",        n.getActorName()        != null ? n.getActorName()        : "");
        m.put("actorAvatarUrl",   n.getActorAvatarUrl()   != null ? n.getActorAvatarUrl()   : "");
        m.put("actorEmail",       n.getActorEmail()       != null ? n.getActorEmail()       : "");
        m.put("trackId",          n.getTrackId()          != null ? n.getTrackId()          : "");
        m.put("trackTitle",       n.getTrackTitle()       != null ? n.getTrackTitle()       : "");
        m.put("trackThumbnailUrl",n.getTrackThumbnailUrl()!= null ? n.getTrackThumbnailUrl(): "");
        return m;
    }
}