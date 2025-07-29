package com.example.social_media.controller;

import com.example.social_media.jwt.JwtService;
import com.example.social_media.service.StoryService;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/api/stories")
public class StoryController {

    private static final Logger logger = LoggerFactory.getLogger(StoryController.class);
    private final StoryService storyService;
    private final JwtService jwtService;

    public StoryController(StoryService storyService, JwtService jwtService) {
        this.storyService = storyService;
        this.jwtService = jwtService;
    }

    @PostMapping(consumes = "multipart/form-data")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> createStory(
            @RequestPart("file") @NotNull MultipartFile file,
            @RequestPart("privacy") @NotNull String privacy,
            @RequestHeader("Authorization") String authHeader) {

        if (file.isEmpty() || file.getContentType() == null || !file.getContentType().startsWith("video")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng cung cấp một file video hợp lệ."));
        }

        try {
            final String token = authHeader.substring(7);
            final String username = jwtService.extractUsername(token);

            // Chỉ cần gọi service, mọi logic phức tạp đã nằm trong Stored Procedure
            storyService.createStory(username, file, privacy);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Đăng story thành công!"));

        } catch (IllegalArgumentException e) {
            logger.warn("Yêu cầu không hợp lệ khi tạo story: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Lỗi server nội bộ khi tạo story", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Đã có lỗi không mong muốn xảy ra. Vui lòng thử lại."));
        }
    }
}
