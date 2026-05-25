package com.soulsound.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Người nhận thông báo
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(50)")
    private NotificationType type;

    // Nội dung hiển thị (ví dụ: "Phú Lê đã thích bài hát của bạn")
    @Column(nullable = false, length = 500)
    private String message;

    // Thông tin người gây ra hành động (actor) – null với thông báo hệ thống
    @Column(name = "actor_name", length = 100)
    private String actorName;

    @Column(name = "actor_avatar_url")
    private String actorAvatarUrl;

    @Column(name = "actor_email", length = 150)
    private String actorEmail;

    // Track liên quan (nếu có)
    @Column(name = "track_id")
    private Long trackId;

    @Column(name = "track_title", length = 200)
    private String trackTitle;

    @Column(name = "track_thumbnail_url")
    private String trackThumbnailUrl;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // ── Constructors ───────────────────────────────────────────────

    public Notification() {}

    // ── Getters / Setters ──────────────────────────────────────────

    public Long             getId()                { return id; }
    public User             getRecipient()         { return recipient; }
    public void             setRecipient(User r)   { this.recipient = r; }
    public NotificationType getType()              { return type; }
    public void             setType(NotificationType t) { this.type = t; }
    public String           getMessage()           { return message; }
    public void             setMessage(String m)   { this.message = m; }
    public String           getActorName()         { return actorName; }
    public void             setActorName(String s) { this.actorName = s; }
    public String           getActorAvatarUrl()    { return actorAvatarUrl; }
    public void             setActorAvatarUrl(String s) { this.actorAvatarUrl = s; }
    public String           getActorEmail()        { return actorEmail; }
    public void             setActorEmail(String s){ this.actorEmail = s; }
    public Long             getTrackId()           { return trackId; }
    public void             setTrackId(Long id)    { this.trackId = id; }
    public String           getTrackTitle()        { return trackTitle; }
    public void             setTrackTitle(String s){ this.trackTitle = s; }
    public String           getTrackThumbnailUrl() { return trackThumbnailUrl; }
    public void             setTrackThumbnailUrl(String s) { this.trackThumbnailUrl = s; }
    public boolean          isRead()               { return read; }
    public void             setRead(boolean b)     { this.read = b; }
    public LocalDateTime    getCreatedAt()         { return createdAt; }
}