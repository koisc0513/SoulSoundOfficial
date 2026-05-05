package com.soulsound.repository;

import com.soulsound.entity.Notification;
import com.soulsound.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId, Pageable pageable);

    long countByRecipientIdAndReadFalse(Long recipientId);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipient.id = :recipientId AND n.read = false")
    void markAllReadByRecipientId(@Param("recipientId") Long recipientId);

    // ── Dedup queries ──────────────────────────────────────────────

    /** NEW_FOLLOWER: 1 thông báo duy nhất mỗi cặp (actor → recipient) */
    List<Notification> findByRecipientIdAndTypeAndActorEmail(
            Long recipientId, NotificationType type, String actorEmail);

    /** TRACK_LIKED / NEW_COMMENT: 1 thông báo duy nhất mỗi (actor + track) */
    List<Notification> findByRecipientIdAndTypeAndActorEmailAndTrackId(
            Long recipientId, NotificationType type, String actorEmail, Long trackId);

    /** TRACK_UPLOAD / TRACK_HIDDEN: 1 thông báo duy nhất mỗi track */
    List<Notification> findByRecipientIdAndTypeAndTrackId(
            Long recipientId, NotificationType type, Long trackId);

    /** ACCOUNT_BANNED: 1 thông báo duy nhất mỗi user */
    List<Notification> findByRecipientIdAndType(
            Long recipientId, NotificationType type);
}