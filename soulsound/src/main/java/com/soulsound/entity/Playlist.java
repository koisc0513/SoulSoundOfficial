package com.soulsound.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "playlists")
public class Playlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 200)
    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "cover_url")
    private String coverUrl;                     // ảnh bìa playlist (tùy chọn)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TrackPrivacy privacy = TrackPrivacy.PUBLIC;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Relationships ──────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    /**
     * Danh sách bài hát trong playlist.
     * Dùng @OrderColumn để giữ thứ tự người dùng sắp xếp.
     * JOIN TABLE: playlist_tracks(playlist_id, track_id, track_order)
     */
    @ManyToMany
    @JoinTable(
            name = "playlist_tracks",
            joinColumns        = @JoinColumn(name = "playlist_id"),
            inverseJoinColumns = @JoinColumn(name = "track_id")
    )
    @OrderColumn(name = "track_order")
    private List<Track> tracks = new ArrayList<>();

    // ── Constructors ───────────────────────────────────────
    public Playlist() {}

    public Playlist(String name, User owner) {
        this.name  = name;
        this.owner = owner;
    }

    // ── Getters / Setters ──────────────────────────────────

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCoverUrl() { return coverUrl; }
    public void setCoverUrl(String coverUrl) { this.coverUrl = coverUrl; }

    public TrackPrivacy getPrivacy() { return privacy; }
    public void setPrivacy(TrackPrivacy privacy) { this.privacy = privacy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }

    public List<Track> getTracks() { return tracks; }

    // ── Helper methods ─────────────────────────────────────

    public int getTrackCount() {
        return tracks.size();
    }

    public void addTrack(Track track) {
        if (!tracks.contains(track)) {
            tracks.add(track);
        }
    }

    public void removeTrack(Track track) {
        tracks.remove(track);
    }
}