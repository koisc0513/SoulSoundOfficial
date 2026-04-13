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
@Table(name = "tracks")
public class Track {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;                 // /uploads/thumbnails/xxx.jpg

    @NotBlank
    @Size(max = 200)
    @Column(name = "title", nullable = false)
    private String title;

    @Size(max = 200)
    @Column(name = "artist")
    private String artist;                       // có thể khác với người upload

    @Size(max = 100)
    @Column(name = "genre")
    private String genre;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @NotBlank
    @Column(name = "file_url", nullable = false)
    private String fileUrl;                      // /uploads/tracks/xxx.mp3

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TrackPrivacy privacy = TrackPrivacy.PUBLIC;

    @Column(name = "play_count", nullable = false)
    private Long playCount = 0L;                 // chỉ tăng khi click play

    /** Cho phép Admin ẩn track mà không xóa */
    @Column(name = "is_hidden", nullable = false)
    private boolean hidden = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Relationships ──────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", nullable = false)
    private User uploader;

    @OneToMany(mappedBy = "track", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "track", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Like> likes = new ArrayList<>();

    @OneToMany(mappedBy = "track", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ListeningHistory> listeningHistories = new ArrayList<>();

    // Playlist sẽ liên kết qua ManyToMany từ phía Playlist

    // ── Constructors ───────────────────────────────────────
    public Track() {}

    // ── Getters / Setters ──────────────────────────────────

    public Long getId() { return id; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getArtist() { return artist; }
    public void setArtist(String artist) { this.artist = artist; }

    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public TrackPrivacy getPrivacy() { return privacy; }
    public void setPrivacy(TrackPrivacy privacy) { this.privacy = privacy; }

    public Long getPlayCount() { return playCount; }
    public void setPlayCount(Long playCount) { this.playCount = playCount; }

    public boolean isHidden() { return hidden; }
    public void setHidden(boolean hidden) { this.hidden = hidden; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public User getUploader() { return uploader; }
    public void setUploader(User uploader) { this.uploader = uploader; }

    public List<Comment> getComments() { return comments; }
    public List<Like> getLikes() { return likes; }
    public List<ListeningHistory> getListeningHistories() { return listeningHistories; }

    // ── Helper methods ─────────────────────────────────────

    /** Tăng lượt nghe khi người dùng click play */
    public void incrementPlayCount() {
        this.playCount++;
    }

    /** Track có thể xem được hay không (public + không bị ẩn) */
    public boolean isVisible() {
        return this.privacy == TrackPrivacy.PUBLIC && !this.hidden;
    }

    public int getLikeCount() {
        return likes.size();
    }

    public int getCommentCount() {
        return comments.size();
    }
}