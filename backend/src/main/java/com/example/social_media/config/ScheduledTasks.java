package com.example.social_media.config; // Hoặc một package phù hợp

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ScheduledTasks {

    private static final Logger logger = LoggerFactory.getLogger(ScheduledTasks.class);
    private final JdbcTemplate jdbcTemplate;

    public ScheduledTasks(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Chạy tác vụ này mỗi giờ. fixedRate = 3600000 milliseconds = 1 giờ.
     */
    @Scheduled(fixedRate = 3600000)
    public void cleanExpiredStories() {
        logger.info("Executing scheduled task: sp_CleanExpiredStories");
        try {
            jdbcTemplate.execute("EXEC sp_CleanExpiredStories");
            logger.info("Successfully executed sp_CleanExpiredStories.");
        } catch (Exception e) {
            logger.error("Error executing scheduled task sp_CleanExpiredStories", e);
        }
    }
}
