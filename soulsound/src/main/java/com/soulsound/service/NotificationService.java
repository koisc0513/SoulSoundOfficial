package com.soulsound.service;

import com.soulsound.entity.*;
import com.soulsound.repository.NotificationRepository;
import org.springframework.data.domain.*;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notifRepo;
    private final SseEmitterService        sseService;

    public NotificationService(NotificationRepository notifRepo, SseEmitterService sseService) {
        this.notifRepo  = notifRepo;
        this.sseService = sseService;
    }

    // ══════════════════════════════════════════════════════════════
    // UPSERT helper — xóa record cũ (nếu có) rồi insert mới
    // Đảm bảo mỗi "sự kiện" chỉ có đúng 1 thông báo, không bị
    // duplicate dù action lặp lại nhiều lần.
    // ══════════════════════════════════════════════════════════════


    /** Push event SSE ngay lập tức đến user đang online */
    private void push(Notification n) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id",               n.getId());
        payload.put("type",             n.getType().name());
        payload.put("message",          n.getMessage());
        payload.put("read",             false);
        payload.put("createdAt",        n.getCreatedAt() != null ? n.getCreatedAt().toString() : "");
        payload.put("actorName",        n.getActorName()         != null ? n.getActorName()         : "");
        payload.put("actorAvatarUrl",   n.getActorAvatarUrl()    != null ? n.getActorAvatarUrl()    : "");
        payload.put("actorEmail",       n.getActorEmail()        != null ? n.getActorEmail()        : "");
        payload.put("trackId",          (Object) n.getTrackId());
        payload.put("commentId",        (Object) n.getCommentId());
        payload.put("trackTitle",       n.getTrackTitle()        != null ? n.getTrackTitle()        : "");
        payload.put("trackThumbnailUrl",n.getTrackThumbnailUrl() != null ? n.getTrackThumbnailUrl() : "");
        sseService.pushToUser(n.getRecipient().getId(), payload);
    }

    private void upsert(List<Notification> duplicates, Notification fresh) {
        if (!duplicates.isEmpty()) {
            notifRepo.deleteAll(duplicates);
            notifRepo.flush();
        }
        Notification saved = notifRepo.save(fresh);
        push(saved);
    }

    // ── Factory helpers ────────────────────────────────────────────

    /**
     * NEW_FOLLOWER: unique trên (recipient, type, actorEmail)
     * → follow / unfollow / follow lại → vẫn chỉ 1 thông báo
     */
    public void notifyNewFollower(User follower, User target) {
        List<Notification> existing = notifRepo
                .findByRecipientIdAndTypeAndActorEmail(
                        target.getId(), NotificationType.NEW_FOLLOWER, follower.getEmail());

        Notification n = new Notification();
        n.setRecipient(target);
        n.setType(NotificationType.NEW_FOLLOWER);
        n.setMessage(follower.getFullName() + " đã bắt đầu theo dõi bạn.");
        n.setActorName(follower.getFullName());
        n.setActorAvatarUrl(follower.getAvatarUrl());
        n.setActorEmail(follower.getEmail());

        upsert(existing, n);
    }

    /**
     * TRACK_UPLOAD: unique trên (recipient, type, trackId)
     * → upload cùng track không tạo thêm thông báo (edge case khi retry)
     */
    public void notifyTrackUploaded(Track track) {
        List<Notification> existing = notifRepo
                .findByRecipientIdAndTypeAndTrackId(
                        track.getUploader().getId(), NotificationType.TRACK_UPLOAD, track.getId());

        Notification n = new Notification();
        n.setRecipient(track.getUploader());
        n.setType(NotificationType.TRACK_UPLOAD);
        n.setMessage("\"" + track.getTitle() + "\" vừa được đăng tải thành công!");
        n.setTrackId(track.getId());
        n.setTrackTitle(track.getTitle());
        n.setTrackThumbnailUrl(track.getThumbnailUrl());

        upsert(existing, n);
    }

    /**
     * TRACK_LIKED: unique trên (recipient, type, actorEmail, trackId)
     * → like / unlike / like lại cùng track → vẫn chỉ 1 thông báo
     */
    public void notifyTrackLiked(User liker, Track track) {
        if (liker.getId().equals(track.getUploader().getId())) return;

        List<Notification> existing = notifRepo
                .findByRecipientIdAndTypeAndActorEmailAndTrackId(
                        track.getUploader().getId(),
                        NotificationType.TRACK_LIKED,
                        liker.getEmail(),
                        track.getId());

        Notification n = new Notification();
        n.setRecipient(track.getUploader());
        n.setType(NotificationType.TRACK_LIKED);
        n.setMessage(liker.getFullName() + " đã thích bài hát \"" + track.getTitle() + "\" của bạn.");
        n.setActorName(liker.getFullName());
        n.setActorAvatarUrl(liker.getAvatarUrl());
        n.setActorEmail(liker.getEmail());
        n.setTrackId(track.getId());
        n.setTrackTitle(track.getTitle());
        n.setTrackThumbnailUrl(track.getThumbnailUrl());

        upsert(existing, n);
    }

    /**
     * NEW_COMMENT: mỗi comment là nội dung khác nhau → KHÔNG dedup theo comment.
     * Nhưng dedup theo (recipient, type, actorEmail, trackId) để tránh spam
     * cùng 1 người comment liên tục tạo hàng chục thông báo.
     * Chỉ giữ 1 thông báo mới nhất mỗi cặp (actor + track).
     */
    public void notifyNewComment(User commenter, Track track, String preview) {
        if (commenter.getId().equals(track.getUploader().getId())) return;

        String snippet = preview.length() > 50 ? preview.substring(0, 47) + "..." : preview;

        List<Notification> existing = notifRepo
                .findByRecipientIdAndTypeAndActorEmailAndTrackId(
                        track.getUploader().getId(),
                        NotificationType.NEW_COMMENT,
                        commenter.getEmail(),
                        track.getId());

        Notification n = new Notification();
        n.setRecipient(track.getUploader());
        n.setType(NotificationType.NEW_COMMENT);
        n.setMessage(commenter.getFullName() + " đã bình luận \"" + snippet + "\" trên bài của bạn.");
        n.setActorName(commenter.getFullName());
        n.setActorAvatarUrl(commenter.getAvatarUrl());
        n.setActorEmail(commenter.getEmail());
        n.setTrackId(track.getId());
        n.setTrackTitle(track.getTitle());
        n.setTrackThumbnailUrl(track.getThumbnailUrl());

        upsert(existing, n);
    }

    /**
     * COMMENT_LIKED: thông báo cho tác giả comment khi người khác tim comment.
     * Dedup theo (recipient, type, actorEmail, commentId)
     * → like / unlike / like lại cùng comment → chỉ 1 thông báo mới nhất.
     * Không thông báo nếu người like chính là tác giả comment.
     */
    public void notifyCommentLiked(User liker, Comment comment, Track track) {
        // Không tự thông báo cho chính mình
        if (liker.getId().equals(comment.getAuthor().getId())) return;

        List<Notification> existing = notifRepo
                .findByRecipientIdAndTypeAndActorEmailAndCommentId(
                        comment.getAuthor().getId(),
                        NotificationType.COMMENT_LIKED,
                        liker.getEmail(),
                        comment.getId());

        Notification n = new Notification();
        n.setRecipient(comment.getAuthor());
        n.setType(NotificationType.COMMENT_LIKED);
        n.setMessage(liker.getFullName() + " đã thích bình luận của bạn trên bài \""
                + track.getTitle() + "\".");
                n.setActorName(liker.getFullName());
        n.setActorAvatarUrl(liker.getAvatarUrl());
        n.setActorEmail(liker.getEmail());
        n.setTrackId(track.getId());
        n.setTrackTitle(track.getTitle());
        n.setTrackThumbnailUrl(track.getThumbnailUrl());
        n.setCommentId(comment.getId());

        upsert(existing, n);
    }

    /**
     * ACCOUNT_BANNED: unique trên (recipient, type)
     */
    public void notifyAccountBanned(User user) {
        List<Notification> existing = notifRepo
                .findByRecipientIdAndType(user.getId(), NotificationType.ACCOUNT_BANNED);

        Notification n = new Notification();
        n.setRecipient(user);
        n.setType(NotificationType.ACCOUNT_BANNED);
        n.setMessage("Tài khoản của bạn đã bị quản trị viên khóa. Vui lòng liên hệ hỗ trợ.");

        upsert(existing, n);
    }

    /**
     * ACCOUNT_UNBANNED: unique trên (recipient, type)
     */
    public void notifyAccountUnbanned(User user) {
        List<Notification> existing = notifRepo
                .findByRecipientIdAndType(user.getId(), NotificationType.ACCOUNT_UNBANNED);

        Notification n = new Notification();
        n.setRecipient(user);
        n.setType(NotificationType.ACCOUNT_UNBANNED);
        n.setMessage("Tài khoản của bạn đã được quản trị viên mở khóa. Chào mừng trở lại!");

        upsert(existing, n);
    }

    /**
     * TRACK_HIDDEN: unique trên (recipient, type, trackId)
     */
    public void notifyTrackHidden(Track track) {
        List<Notification> existing = notifRepo
                .findByRecipientIdAndTypeAndTrackId(
                        track.getUploader().getId(), NotificationType.TRACK_HIDDEN, track.getId());

        Notification n = new Notification();
        n.setRecipient(track.getUploader());
        n.setType(NotificationType.TRACK_HIDDEN);
        n.setMessage("Bài hát \"" + track.getTitle() + "\" của bạn đã bị ẩn bởi quản trị viên.");
        n.setTrackId(track.getId());
        n.setTrackTitle(track.getTitle());
        n.setTrackThumbnailUrl(track.getThumbnailUrl());

        upsert(existing, n);
    }

    /**
     * TRACK_UNHIDDEN: unique trên (recipient, type, trackId)
     */
    public void notifyTrackUnhidden(Track track) {
        List<Notification> existing = notifRepo
                .findByRecipientIdAndTypeAndTrackId(
                        track.getUploader().getId(), NotificationType.TRACK_UNHIDDEN, track.getId());

        Notification n = new Notification();
        n.setRecipient(track.getUploader());
        n.setType(NotificationType.TRACK_UNHIDDEN);
        n.setMessage("Bài hát \"" + track.getTitle() + "\" của bạn đã được khôi phục hiển thị.");
        n.setTrackId(track.getId());
        n.setTrackTitle(track.getTitle());
        n.setTrackThumbnailUrl(track.getThumbnailUrl());

        upsert(existing, n);
    }

    /**
     * ADMIN_MESSAGE: mỗi lần gửi là 1 thông báo độc lập (không dedup)
     */
    public void notifyAdminMessage(User recipient, String message) {
        Notification n = new Notification();
        n.setRecipient(recipient);
        n.setType(NotificationType.ADMIN_MESSAGE);
        n.setMessage(message);
        notifRepo.save(n);
    }

    // ── Queries ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<Notification> getNotifications(Long recipientId, int page) {
        Pageable pageable = PageRequest.of(page, 20);
        return notifRepo.findByRecipientIdOrderByCreatedAtDesc(recipientId, pageable);
    }

    @Transactional(readOnly = true)
    public long countUnread(Long recipientId) {
        return notifRepo.countByRecipientIdAndReadFalse(recipientId);
    }

    public void markAllRead(Long recipientId) {
        notifRepo.markAllReadByRecipientId(recipientId);
    }

    public void markOneRead(Long notifId, Long recipientId) {
        notifRepo.findById(notifId).ifPresent(n -> {
            if (n.getRecipient().getId().equals(recipientId)) {
                n.setRead(true);
                notifRepo.save(n);
            }
        });
    }
}