package com.soulsound.repository;

import com.soulsound.entity.ListeningHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ListeningHistoryRepository
        extends JpaRepository<ListeningHistory, Long> {

    // Lấy lịch sử nghe mới nhất
    Page<ListeningHistory> findByUser_IdOrderByListenedAtDesc(
            Long userId, Pageable pageable);

    // Tìm lịch sử cụ thể
    Optional<ListeningHistory> findByUser_IdAndTrack_Id(
            Long userId, Long trackId);

    // Xóa 1 track khỏi history
    void deleteByUser_IdAndTrack_Id(
            Long userId, Long trackId);

    // Xóa toàn bộ history
    void deleteByUser_Id(Long userId);
}