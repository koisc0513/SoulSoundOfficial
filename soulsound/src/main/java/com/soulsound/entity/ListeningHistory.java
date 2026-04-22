package com.soulsound.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "listening_history",
        indexes = {
                @Index(name = "idx_history_user", columnList = "user_id"),
                @Index(name = "idx_history_track", columnList = "track_id")
        }
)
public class ListeningHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "track_id", nullable = false)
    private Track track;

    @CreationTimestamp
    @Column(name = "listened_at")
    private LocalDateTime listenedAt;

    // ── Constructors ───────────────────────────────────────

    public ListeningHistory() {}

    public ListeningHistory(User user, Track track) {
        this.user = user;
        this.track = track;
    }

    // ── Getters ────────────────────────────────────────────

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Track getTrack() {
        return track;
    }

    public LocalDateTime getListenedAt() {
        return listenedAt;
    }
}