package com.soulsound.repository;

import com.soulsound.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Like.LikeId> {
    Optional<Like> findByUserIdAndTrackId(Long userId, Long trackId);
    boolean existsByUserIdAndTrackId(Long userId, Long trackId);
    List<Like> findByUserIdOrderByLikedAtDesc(Long userId);
    long countByTrackId(Long trackId);
}