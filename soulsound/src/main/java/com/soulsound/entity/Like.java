package com.soulsound.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "likes",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "track_id"}))
public class Like {

    @EmbeddedId
    private LikeId id = new LikeId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("trackId")
    @JoinColumn(name = "track_id")
    private Track track;

    @CreationTimestamp
    @Column(name = "liked_at", updatable = false)
    private LocalDateTime likedAt;

    // ── Constructors ───────────────────────────────────────
    public Like() {}

    public Like(User user, Track track) {
        this.user  = user;
        this.track = track;
        this.id    = new LikeId(user.getId(), track.getId());
    }

    // ── Getters ────────────────────────────────────────────

    public LikeId getId()        { return id; }
    public User getUser()        { return user; }
    public Track getTrack()      { return track; }
    public LocalDateTime getLikedAt() { return likedAt; }

    // ── Embeddable Composite Key ───────────────────────────

    @Embeddable
    public static class LikeId implements Serializable {
        @Column(name = "user_id")
        private Long userId;

        @Column(name = "track_id")
        private Long trackId;

        public LikeId() {}

        public LikeId(Long userId, Long trackId) {
            this.userId  = userId;
            this.trackId = trackId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof LikeId)) return false;
            LikeId that = (LikeId) o;
            return Objects.equals(userId, that.userId) && Objects.equals(trackId, that.trackId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, trackId);
        }

        public Long getUserId()  { return userId; }
        public Long getTrackId() { return trackId; }
    }
}