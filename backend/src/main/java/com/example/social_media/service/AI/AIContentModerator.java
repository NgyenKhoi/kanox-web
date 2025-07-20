package com.example.social_media.service.AI;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AIContentModerator {

    private final PostModerationService postModerationService;

    @Scheduled(fixedRate = 60000)
    public void autoModeratePosts() {
        log.info("⏱ Bắt đầu job AI content moderation...");
        try {
            postModerationService.moderateUncheckedPosts(); // ✅ Gọi hàm batch mới
        } catch (Exception e) {
            log.error("❌ Job kiểm duyệt thất bại: {}", e.getMessage(), e);
        }
        log.info("✅ Kết thúc job AI content moderation.");
    }
}
