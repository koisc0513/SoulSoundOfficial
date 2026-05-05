package com.soulsound.repository;

import com.soulsound.entity.Track;
import com.soulsound.entity.TrackPrivacy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface TrackRepository extends JpaRepository<Track, Long> {

    Page<Track> findByPrivacyAndHiddenFalseOrderByCreatedAtDesc(TrackPrivacy privacy, Pageable pageable);

    @Query("SELECT t FROM Track t WHERE t.privacy = 'PUBLIC' AND t.hidden = false " +
            "AND ( :keyword = '' OR LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(t.artist) LIKE LOWER(CONCAT('%', :keyword, '%')) ) ORDER BY t.createdAt DESC")
    Page<Track> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT t FROM Track t WHERE t.privacy = 'PUBLIC' AND t.hidden = false " +
            "AND ( :genre = '' OR t.genre = :genre ) " +
            "AND ( :keyword = '' OR LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(t.artist) LIKE LOWER(CONCAT('%', :keyword, '%')) ) ORDER BY t.createdAt DESC")
    Page<Track> searchByKeywordAndGenre(@Param("keyword") String keyword, @Param("genre") String genre, Pageable pageable);

    List<Track> findByUploaderIdOrderByCreatedAtDesc(Long uploaderId);

    @Modifying
    @Transactional
    @Query("UPDATE Track t SET t.playCount = t.playCount + 1 WHERE t.id = :id")
    void incrementPlayCount(@Param("id") Long id);

    @Query("SELECT COALESCE(SUM(t.playCount),0) FROM Track t")
    Long sumAllPlayCounts();

    long countByHiddenFalse();

    // ── Overview stats ─────────────────────────────────────────────

    // Tong luot nghe cua 1 user
    @Query("SELECT COALESCE(SUM(t.playCount),0) FROM Track t WHERE t.uploader.id = :uid")
    Long sumPlayCountByUploaderId(@Param("uid") Long uid);

    // Top tracks cua user (theo playCount)
    @Query("SELECT t FROM Track t WHERE t.uploader.id = :uid AND t.hidden = false ORDER BY t.playCount DESC")
    List<Track> findTopTracksByUploaderId(@Param("uid") Long uid, Pageable pageable);
}