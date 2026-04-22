package com.soulsound.service;

import com.soulsound.dto.TrackEditDto;
import com.soulsound.dto.TrackUploadDto;
import com.soulsound.entity.*;
import com.soulsound.repository.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.*;

@Service
@Transactional
public class TrackService {

    private final TrackRepository          trackRepo;
    private final LikeRepository           likeRepo;
    private final CommentRepository        commentRepo;
    private final ListeningHistoryRepository historyRepo;
    private final UserRepository           userRepo;
    private final FileStorageService       fileStorage;

    public TrackService(TrackRepository trackRepo,
                        LikeRepository likeRepo,
                        CommentRepository commentRepo,
                        ListeningHistoryRepository historyRepo,
                        UserRepository userRepo,
                        FileStorageService fileStorage) {
        this.trackRepo   = trackRepo;
        this.likeRepo    = likeRepo;
        this.commentRepo = commentRepo;
        this.historyRepo = historyRepo;
        this.userRepo    = userRepo;
        this.fileStorage = fileStorage;
    }

    // ── Upload bài hát mới ──────────────────────────────────────────

    public Track upload(TrackUploadDto dto, Long uploaderId) throws IOException {
        if (dto.getAudioFile() == null || dto.getAudioFile().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn file nhạc .mp3.");
        }

        User uploader = userRepo.findById(uploaderId)
                .orElseThrow(() -> new NoSuchElementException("User không tồn tại."));

        String fileUrl = fileStorage.saveTrack(dto.getAudioFile());

        String thumbnailUrl = null;
        if (dto.getThumbnailFile() != null && !dto.getThumbnailFile().isEmpty()) {
            thumbnailUrl = fileStorage.saveThumbnail(dto.getThumbnailFile());
        }

        Track track = new Track();
        track.setTitle(dto.getTitle());
        track.setArtist(dto.getArtist() != null && !dto.getArtist().isBlank()
                ? dto.getArtist() : uploader.getFullName());
        track.setGenre(dto.getGenre());
        track.setDescription(dto.getDescription());
        track.setFileUrl(fileUrl);
        track.setThumbnailUrl(thumbnailUrl);
        track.setPrivacy(dto.getPrivacy() != null ? dto.getPrivacy() : TrackPrivacy.PUBLIC);
        track.setUploader(uploader);

        return trackRepo.save(track);
    }

    // ── Chỉnh sửa track ─────────────────────────────────────────────

    public Track edit(Long trackId, TrackEditDto dto, Long requesterId) throws IOException {
        Track track = findById(trackId);

        // Chỉ uploader hoặc Admin mới được sửa
        if (!track.getUploader().getId().equals(requesterId)) {
            User requester = userRepo.findById(requesterId)
                    .orElseThrow(() -> new NoSuchElementException("User không tồn tại."));
            if (requester.getRole() != Role.ADMIN) {
                throw new SecurityException("Bạn không có quyền chỉnh sửa bài hát này.");
            }
        }

        track.setTitle(dto.getTitle());
        track.setArtist(dto.getArtist());
        track.setGenre(dto.getGenre());
        track.setDescription(dto.getDescription());
        if (dto.getPrivacy() != null) track.setPrivacy(dto.getPrivacy());

        // Thay file nhạc mới (giữ metadata)
        if (dto.getNewAudioFile() != null && !dto.getNewAudioFile().isEmpty()) {
            fileStorage.deleteFile(track.getFileUrl());
            track.setFileUrl(fileStorage.saveTrack(dto.getNewAudioFile()));
        }

        // Thay thumbnail mới
        if (dto.getNewThumbnailFile() != null && !dto.getNewThumbnailFile().isEmpty()) {
            if (track.getThumbnailUrl() != null) {
                fileStorage.deleteFile(track.getThumbnailUrl());
            }
            track.setThumbnailUrl(fileStorage.saveThumbnail(dto.getNewThumbnailFile()));
        }

        return trackRepo.save(track);
    }

    // ── Xóa track ───────────────────────────────────────────────────

    public void delete(Long trackId, Long requesterId) {
        Track track = findById(trackId);

        User requester = userRepo.findById(requesterId)
                .orElseThrow(() -> new NoSuchElementException("User không tồn tại."));

        boolean isOwner = track.getUploader().getId().equals(requesterId);
        boolean isAdmin = requester.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new SecurityException("Bạn không có quyền xóa bài hát này.");
        }

        // Xóa file vật lý
        fileStorage.deleteFile(track.getFileUrl());
        if (track.getThumbnailUrl() != null) {
            fileStorage.deleteFile(track.getThumbnailUrl());
        }

        trackRepo.delete(track);
    }

    // ── Admin: Ẩn/Hiện track ────────────────────────────────────────

    public void toggleHidden(Long trackId) {
        Track track = findById(trackId);
        track.setHidden(!track.isHidden());
        trackRepo.save(track);
    }

    // ── Tăng lượt nghe (AJAX, không cần load entity) ────────────────

    public void incrementPlayCount(Long trackId) {
        trackRepo.incrementPlayCount(trackId);
    }

    // ── Ghi lịch sử nghe ────────────────────────────────────────────

    public void recordListeningHistory(Long trackId, Long userId) {

        Track track = findById(trackId);

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User không tồn tại."));

        // Xóa record cũ
        historyRepo.deleteByUser_IdAndTrack_Id(userId, trackId);

        // Insert mới
        historyRepo.save(new ListeningHistory(user, track));
    }

    // ── Like / Unlike ───────────────────────────────────────────────

    /**
     * @return Map với keys: liked (boolean), likeCount (long)
     */
    public Map<String, Object> toggleLike(Long trackId, Long userId) {
        Track track = findById(trackId);
        User  user  = userRepo.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User không tồn tại."));

        boolean liked;
        Optional<Like> existing = likeRepo.findByUserIdAndTrackId(userId, trackId);

        if (existing.isPresent()) {
            likeRepo.delete(existing.get());
            liked = false;
        } else {
            likeRepo.save(new Like(user, track));
            liked = true;
        }

        long likeCount = likeRepo.countByTrackId(trackId);

        Map<String, Object> result = new HashMap<>();
        result.put("liked",     liked);
        result.put("likeCount", likeCount);
        return result;
    }

    // ── Comment ─────────────────────────────────────────────────────

    public Comment addComment(Long trackId, Long userId, String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Nội dung bình luận không được để trống.");
        }
        Track track = findById(trackId);
        User  user  = userRepo.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User không tồn tại."));

        Comment comment = new Comment(content.trim(), user, track);
        return commentRepo.save(comment);
    }

    public void deleteComment(Long commentId, Long requesterId) {
        Comment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new NoSuchElementException("Comment không tồn tại."));

        User requester = userRepo.findById(requesterId)
                .orElseThrow(() -> new NoSuchElementException("User không tồn tại."));

        boolean isAuthor      = comment.getAuthor().getId().equals(requesterId);
        boolean isTrackOwner  = comment.getTrack().getUploader().getId().equals(requesterId);
        boolean isAdmin       = requester.getRole() == Role.ADMIN;

        if (!isAuthor && !isTrackOwner && !isAdmin) {
            throw new SecurityException("Bạn không có quyền xóa bình luận này.");
        }

        commentRepo.delete(comment);
    }

    // ── Truy vấn Feed / Danh sách ───────────────────────────────────

    @Transactional(readOnly = true)
    public Page<Track> getPublicFeed(int page) {
        Pageable pageable = PageRequest.of(page, 12);
        return trackRepo.findByPrivacyAndHiddenFalseOrderByCreatedAtDesc(
                TrackPrivacy.PUBLIC, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Track> searchByTitle(String keyword, String genre, int page) {
        Pageable pageable = PageRequest.of(page, 12);

        String kw = (keyword != null) ? keyword.trim() : "";
        String g  = (genre   != null) ? genre.trim()   : "";

        boolean hasGenre   = !g.isBlank();
        boolean hasKeyword = !kw.isBlank();

        if (hasGenre && hasKeyword) {
            return trackRepo.searchByKeywordAndGenre(kw, g, pageable);
        }
        if (hasGenre) {
            return trackRepo.searchByKeywordAndGenre("", g, pageable);
        }
        if (hasKeyword) {
            return trackRepo.searchByKeyword(kw, pageable);
        }
        // Không có filter → feed mới nhất
        return trackRepo.findByPrivacyAndHiddenFalseOrderByCreatedAtDesc(
                TrackPrivacy.PUBLIC, pageable);
    }

    @Transactional(readOnly = true)
    public List<Track> getTracksByUser(Long userId) {
        return trackRepo.findByUploaderIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public Track findById(Long id) {
        return trackRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy track #" + id));
    }

    @Transactional(readOnly = true)
    public Page<Track> findAllAdmin(int page) {
        Pageable pageable = PageRequest.of(page, 20, Sort.by("createdAt").descending());
        return trackRepo.findAll(pageable);
    }

    // ── Lịch sử nghe ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ListeningHistory> getHistory(Long userId, int page) {
        Pageable pageable = PageRequest.of(page, 20);
        return historyRepo.findByUser_IdOrderByListenedAtDesc(userId, pageable);
    }

    /** Xóa 1 bài khỏi lịch sử nghe */
    public void removeFromHistory(Long trackId, Long userId) {
        historyRepo.deleteByUser_IdAndTrack_Id(userId, trackId);
    }

    /** Xóa toàn bộ lịch sử nghe */
    public void clearHistory(Long userId) {
        historyRepo.deleteByUser_Id(userId);
    }

    // ── Stats ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public long countAllTracks()  { return trackRepo.countByHiddenFalse(); }

    @Transactional(readOnly = true)
    public Long sumAllPlayCounts(){ return trackRepo.sumAllPlayCounts(); }
}