package com.soulsound.repository;

import com.soulsound.entity.ListeningHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ListeningHistoryRepository extends JpaRepository<ListeningHistory, Long> {
    Page<ListeningHistory> findByUserIdOrderByListenedAtDesc(Long userId, Pageable pageable);
}