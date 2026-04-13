package com.soulsound.repository;

import com.soulsound.entity.Playlist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlaylistRepository extends JpaRepository<Playlist, Long> {
    List<Playlist> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
}