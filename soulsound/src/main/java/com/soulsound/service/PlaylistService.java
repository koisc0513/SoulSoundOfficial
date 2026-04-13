package com.soulsound.service;

import com.soulsound.entity.*;
import com.soulsound.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class PlaylistService {

    private final PlaylistRepository playlistRepo;
    private final TrackRepository    trackRepo;
    private final UserRepository     userRepo;

    public PlaylistService(PlaylistRepository playlistRepo,
                           TrackRepository trackRepo,
                           UserRepository userRepo) {
        this.playlistRepo = playlistRepo;
        this.trackRepo    = trackRepo;
        this.userRepo     = userRepo;
    }

    // ── Tạo playlist ────────────────────────────────────────────────

    public Playlist create(String name, String description, Long ownerId) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Tên playlist không được để trống.");
        }
        User owner = userRepo.findById(ownerId)
                .orElseThrow(() -> new NoSuchElementException("User không tồn tại."));

        Playlist playlist = new Playlist(name.trim(), owner);
        playlist.setDescription(description);
        return playlistRepo.save(playlist);
    }

    // ── Xóa playlist ────────────────────────────────────────────────

    public void delete(Long playlistId, Long requesterId) {
        Playlist playlist = findById(playlistId);
        if (!playlist.getOwner().getId().equals(requesterId)) {
            throw new SecurityException("Bạn không có quyền xóa playlist này.");
        }
        playlistRepo.delete(playlist);
    }

    // ── Thêm bài hát vào playlist ───────────────────────────────────

    public Playlist addTrack(Long playlistId, Long trackId, Long requesterId) {
        Playlist playlist = findById(playlistId);
        checkOwner(playlist, requesterId);

        Track track = trackRepo.findById(trackId)
                .orElseThrow(() -> new NoSuchElementException("Track không tồn tại."));

        // Chỉ thêm track public hoặc của chính chủ playlist
        boolean isOwnerOfTrack = track.getUploader().getId().equals(requesterId);
        if (track.getPrivacy() == TrackPrivacy.PRIVATE && !isOwnerOfTrack) {
            throw new SecurityException("Không thể thêm bài hát riêng tư của người khác.");
        }

        playlist.addTrack(track);
        return playlistRepo.save(playlist);
    }

    // ── Xóa bài hát khỏi playlist ───────────────────────────────────

    public Playlist removeTrack(Long playlistId, Long trackId, Long requesterId) {
        Playlist playlist = findById(playlistId);
        checkOwner(playlist, requesterId);

        Track track = trackRepo.findById(trackId)
                .orElseThrow(() -> new NoSuchElementException("Track không tồn tại."));

        playlist.removeTrack(track);
        return playlistRepo.save(playlist);
    }

    // ── Cập nhật tên / mô tả ────────────────────────────────────────

    public Playlist update(Long playlistId, String name, String description, Long requesterId) {
        Playlist playlist = findById(playlistId);
        checkOwner(playlist, requesterId);

        if (name != null && !name.isBlank()) playlist.setName(name.trim());
        playlist.setDescription(description);
        return playlistRepo.save(playlist);
    }

    // ── Truy vấn ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Playlist findById(Long id) {
        return playlistRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy playlist #" + id));
    }

    @Transactional(readOnly = true)
    public List<Playlist> getByOwner(Long ownerId) {
        return playlistRepo.findByOwnerIdOrderByCreatedAtDesc(ownerId);
    }

    // ── Helper ──────────────────────────────────────────────────────

    private void checkOwner(Playlist playlist, Long requesterId) {
        if (!playlist.getOwner().getId().equals(requesterId)) {
            throw new SecurityException("Bạn không có quyền chỉnh sửa playlist này.");
        }
    }
}