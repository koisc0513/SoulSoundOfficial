package com.soulsound.repository;

import com.soulsound.entity.ListeningHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ListeningHistoryRepository extends JpaRepository<ListeningHistory, Long> {

    Page<ListeningHistory> findByUser_IdOrderByListenedAtDesc(Long userId, Pageable pageable);

    Optional<ListeningHistory> findByUser_IdAndTrack_Id(Long userId, Long trackId);

    void deleteByUser_IdAndTrack_Id(Long userId, Long trackId);

    void deleteByUser_Id(Long userId);

    // Daily plays chart: count listens per day for tracks belonging to uploader
    @Query("SELECT h.listenedAt, COUNT(h) FROM ListeningHistory h " +
            "WHERE h.track.uploader.id = :uid AND h.listenedAt >= :since " +
            "GROUP BY h.listenedAt ORDER BY h.listenedAt ASC")
    List<Object[]> countDailyPlaysByUploaderId(
            @Param("uid") Long uid,
            @Param("since") LocalDateTime since);
}