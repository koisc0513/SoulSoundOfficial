package com.soulsound.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Quản lý SSE connections: userId → SseEmitter.
 * Khi admin gửi thông báo, push event ngay lập tức đến user đang online.
 */
@Service
public class SseEmitterService {

    // Map: userId → emitter (1 user 1 connection)
    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Timeout 5 phút — client tự reconnect khi timeout
    private static final long TIMEOUT_MS = 5 * 60 * 1000L;

    /**
     * User kết nối SSE — tạo emitter mới, cleanup khi disconnect.
     */
    public SseEmitter subscribe(Long userId) {
        // Xóa emitter cũ nếu có (tab mới mở)
        SseEmitter old = emitters.get(userId);
        if (old != null) {
            old.complete();
            emitters.remove(userId);
        }

        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);

        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(()    -> emitters.remove(userId));
        emitter.onError(e ->      emitters.remove(userId));

        emitters.put(userId, emitter);

        // Gửi comment ngay khi connect để browser biết kết nối thành công
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("ok"));
        } catch (IOException e) {
            emitters.remove(userId);
            emitter.completeWithError(e);
        }

        return emitter;
    }

    /**
     * Push thông báo đến 1 user cụ thể (nếu đang online).
     * Được gọi từ NotificationService sau khi save vào DB.
     */
    public void pushToUser(Long userId, Map<String, Object> payload) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter == null) return; // user không online → thôi, polling sẽ lấy sau

        try {
            String json = objectMapper.writeValueAsString(payload);
            emitter.send(SseEmitter.event()
                    .name("notification")
                    .data(json));
        } catch (IOException e) {
            emitters.remove(userId);
            emitter.completeWithError(e);
        }
    }

    /**
     * Ping tất cả emitter để giữ connection sống (gọi từ scheduler).
     */
    public void pingAll() {
        emitters.forEach((userId, emitter) -> {
            try {
                emitter.send(SseEmitter.event().name("ping").data(""));
            } catch (IOException e) {
                emitters.remove(userId);
            }
        });
    }

    public int activeConnections() {
        return emitters.size();
    }
}