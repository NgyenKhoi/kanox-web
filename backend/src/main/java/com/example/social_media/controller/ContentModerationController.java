package com.example.social_media.controller;

import com.example.social_media.service.ContentModerationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/content-moderation")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class ContentModerationController {
    
    private final ContentModerationService contentModerationService;
    
    @Autowired
    public ContentModerationController(ContentModerationService contentModerationService) {
        this.contentModerationService = contentModerationService;
    }
    
    /**
     * Kiểm tra toàn diện nội dung (tương tự sp_CheckContentPolicy)
     */
    @PostMapping("/check-content")
    public ResponseEntity<Map<String, Object>> checkContentPolicy(@RequestBody Map<String, String> request) {
        try {
            String content = request.get("content");
            
            if (content == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Content is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer userId = Integer.parseInt(auth.getName());
            
            Map<String, Object> result = contentModerationService.checkContentPolicy(content, userId);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to check content");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Kiểm tra nội dung đơn giản (chỉ trả về true/false)
     */
    @PostMapping("/validate-content")
    public ResponseEntity<Map<String, Object>> validateContent(@RequestBody Map<String, String> request) {
        try {
            String content = request.get("content");
            
            if (content == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Content is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            boolean isValid = contentModerationService.isContentValid(content);
            
            Map<String, Object> response = new HashMap<>();
            response.put("isValid", isValid);
            response.put("content", content);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to validate content");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Làm sạch nội dung bằng cách thay thế các từ khóa bị cấm
     */
    @PostMapping("/sanitize-content")
    public ResponseEntity<Map<String, Object>> sanitizeContent(@RequestBody Map<String, String> request) {
        try {
            String content = request.get("content");
            String replacement = request.get("replacement");
            
            if (content == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Content is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            String sanitizedContent = contentModerationService.sanitizeContent(content, replacement);
            
            Map<String, Object> response = new HashMap<>();
            response.put("originalContent", content);
            response.put("sanitizedContent", sanitizedContent);
            response.put("wasModified", !content.equals(sanitizedContent));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to sanitize content");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Kiểm tra và làm sạch nội dung trong một lần gọi
     */
    @PostMapping("/check-and-sanitize")
    public ResponseEntity<Map<String, Object>> checkAndSanitizeContent(@RequestBody Map<String, String> request) {
        try {
            String content = request.get("content");
            String replacement = request.get("replacement");
            
            if (content == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Content is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer userId = Integer.parseInt(auth.getName());
            
            Map<String, Object> result = contentModerationService.checkAndSanitizeContent(content, userId, replacement);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to check and sanitize content");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Lấy thống kê về banned keywords và content policies
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getModerationStatistics() {
        try {
            Map<String, Object> statistics = contentModerationService.getModerationStatistics();
            
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to get moderation statistics");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Endpoint tổng hợp để kiểm tra nhiều nội dung cùng lúc
     */
    @PostMapping("/batch-check")
    public ResponseEntity<Map<String, Object>> batchCheckContent(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            java.util.List<String> contents = (java.util.List<String>) request.get("contents");
            
            if (contents == null || contents.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Contents array is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer userId = Integer.parseInt(auth.getName());
            
            java.util.List<Map<String, Object>> results = new java.util.ArrayList<>();
            int validCount = 0;
            int invalidCount = 0;
            
            for (int i = 0; i < contents.size(); i++) {
                String content = contents.get(i);
                Map<String, Object> result = contentModerationService.checkContentPolicy(content, userId);
                result.put("index", i);
                results.add(result);
                
                if ((Boolean) result.get("isValid")) {
                    validCount++;
                } else {
                    invalidCount++;
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("results", results);
            response.put("totalChecked", contents.size());
            response.put("validCount", validCount);
            response.put("invalidCount", invalidCount);
            response.put("validPercentage", contents.size() > 0 ? (double) validCount / contents.size() * 100 : 0);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to batch check content");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}