package com.soulsound.repository;

import com.soulsound.entity.ListeningHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ListeningHistoryRepository extends JpaRepository<ListeningHistory, Long> {

    // lịch sử nghe gần nhất
    Page<ListeningHistory> findByUser_IdOrderByListenedAtDesc(
            Long userId,
            Pageable pageable
    );

    void deleteByUser_IdAndTrack_Id(Long userId, Long trackId);

    void deleteByUser_Id(Long userId);

    // tổng lượt nghe của uploader (có tính nghe lặp lại)
    @Query("""
        SELECT COUNT(h)
        FROM ListeningHistory h
        WHERE h.track.uploader.id = :uid
    """)
    Long countTotalPlaysByUploaderId(@Param("uid") Long uid);

    // daily plays chart
    @Query("""
        SELECT DATE(h.listenedAt), COUNT(h)
        FROM ListeningHistory h
        WHERE h.track.uploader.id = :uid
          AND h.listenedAt >= :since
        GROUP BY DATE(h.listenedAt)
        ORDER BY DATE(h.listenedAt) ASC
    """)
    List<Object[]> countDailyPlaysByUploaderId(
            @Param("uid") Long uid,
            @Param("since") LocalDateTime since
    );

    // top listeners
    @Query("""
        SELECT h.user, COUNT(h) as cnt
        FROM ListeningHistory h
        WHERE h.track.uploader.id = :uid
          AND h.user.id <> :uid
          AND h.listenedAt >= :since
        GROUP BY h.user
        ORDER BY cnt DESC
    """)
    List<Object[]> findTopListenersByUploaderId(
            @Param("uid") Long uid,
            @Param("since") LocalDateTime since,
            Pageable pageable
    );

    /**
     * Lịch sử nghe: chỉ lấy lần nghe MỚI NHẤT mỗi bài (dedup cho trang History)
     * Mỗi bài chỉ hiện 1 lần dù đã nghe nhiều lần
     */
    @Query("""
        SELECT h FROM ListeningHistory h
        WHERE h.id IN (
            SELECT MAX(h2.id)
            FROM ListeningHistory h2
            WHERE h2.user.id = :userId
            GROUP BY h2.track.id
        )
        ORDER BY h.listenedAt DESC
    """)
    Page<ListeningHistory> findLatestPerTrackByUserId(
            @Param("userId") Long userId,
            Pageable pageable
    );

}