package com.soulsound.repository;

import com.soulsound.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByTrackIdOrderByCreatedAtDesc(Long trackId);
    List<Comment> findByAuthorIdOrderByCreatedAtDesc(Long authorId);

    /** Chỉ lấy bình luận gốc (không phải reply) theo thứ tự cũ → mới */
    List<Comment> findByTrackIdAndParentIsNullOrderByCreatedAtAsc(Long trackId);

    @Query("SELECT COALESCE(COUNT(c),0) FROM Comment c WHERE c.track.uploader.id = :uid")
    Long countCommentsByUploaderId(@Param("uid") Long uid);

    // Daily comments chart
    @Query("SELECT c.createdAt, COUNT(c) FROM Comment c " +
            "WHERE c.track.uploader.id = :uid AND c.createdAt >= :since " +
            "GROUP BY c.createdAt ORDER BY c.createdAt ASC")
    List<Object[]> countDailyCommentsByUploaderId(
            @Param("uid") Long uid,
            @Param("since") LocalDateTime since);
}