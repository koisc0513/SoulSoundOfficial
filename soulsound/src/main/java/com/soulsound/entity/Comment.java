package com.soulsound.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "comments")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 1000)
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // ── Relationships ──────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "track_id", nullable = false)
    private Track track;

    /** Null = bình luận gốc. Non-null = trả lời của uploader. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Comment parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @org.hibernate.annotations.OrderBy(clause = "created_at ASC")
    private java.util.List<Comment> replies = new java.util.ArrayList<>();

    /** Persistent like counter – updated atomically, avoids N+1 on collection */
    @Column(name = "like_count", nullable = false)
    private long likeCount = 0L;

    @OneToMany(mappedBy = "comment", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<CommentLike> likes = new java.util.ArrayList<>();

    // ── Constructors ───────────────────────────────────────
    public Comment() {}

    public Comment(String content, User author, Track track) {
        this.content = content;
        this.author  = author;
        this.track   = track;
    }

    // ── Getters / Setters ──────────────────────────────────

    public Long getId() { return id; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }

    public Track getTrack() { return track; }
    public void setTrack(Track track) { this.track = track; }

    public Comment getParent() { return parent; }
    public void setParent(Comment parent) { this.parent = parent; }

    public java.util.List<Comment> getReplies() { return replies; }

    public long getLikeCount()              { return likeCount; }
    public void setLikeCount(long likeCount){ this.likeCount = likeCount; }
    public java.util.List<CommentLike> getLikes() { return likes; }
}