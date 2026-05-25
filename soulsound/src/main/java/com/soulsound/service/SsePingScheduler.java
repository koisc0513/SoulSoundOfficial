package com.soulsound.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Ping tất cả SSE connection mỗi 2 phút để giữ kết nối sống.
 * Nginx / proxy thường đóng connection idle sau 60–90 giây.
 */
@Component
public class SsePingScheduler {

    private final SseEmitterService sseService;

    public SsePingScheduler(SseEmitterService sseService) {
        this.sseService = sseService;
    }

    @Scheduled(fixedDelay = 120_000) // mỗi 2 phút
    public void ping() {
        sseService.pingAll();
    }
}