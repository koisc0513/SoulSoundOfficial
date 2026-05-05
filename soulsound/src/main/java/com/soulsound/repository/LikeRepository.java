package com.soulsound.repository;

import com.soulsound.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Like.LikeId> {
    Optional<Like> findByUserIdAndTrackId(Long userId, Long trackId);
    boolean existsByUserIdAndTrackId(Long userId, Long trackId);
    List<Like> findByUserIdOrderByLikedAtDesc(Long userId);
    long countByTrackId(Long trackId);

    @Query("SELECT COALESCE(COUNT(l),0) FROM Like l WHERE l.track.uploader.id = :uid")
    Long countLikesByUploaderId(@Param("uid") Long uid);

    @Query("SELECT l.user, COUNT(l) as cnt FROM Like l " +
            "WHERE l.track.uploader.id = :uid AND l.user.id <> :uid AND l.likedAt >= :since " +
            "GROUP BY l.user ORDER BY cnt DESC")
    List<Object[]> findTopListenersByUploaderId(
            @Param("uid") Long uid,
            @Param("since") LocalDateTime since,
            org.springframework.data.domain.Pageable pageable);

    // Daily likes chart
    @Query("SELECT l.likedAt, COUNT(l) FROM Like l " +
            "WHERE l.track.uploader.id = :uid AND l.likedAt >= :since " +
            "GROUP BY l.likedAt ORDER BY l.likedAt ASC")
    List<Object[]> countDailyLikesByUploaderId(
            @Param("uid") Long uid,
            @Param("since") LocalDateTime since);
}