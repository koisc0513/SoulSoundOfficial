package com.soulsound.repository;

import com.soulsound.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByTrackIdOrderByCreatedAtDesc(Long trackId);
    List<Comment> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
}