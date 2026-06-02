package com.soulsound.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "comment_likes",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_comment_like_user",
                columnNames = {"user_id", "comment_id"}
        )
)
public class CommentLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    private Comment comment;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public CommentLike() {}

    public CommentLike(User user, Comment comment) {
        this.user    = user;
        this.comment = comment;
    }

    public Long    getId()        { return id; }
    public User    getUser()      { return user; }
    public Comment getComment()   { return comment; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}