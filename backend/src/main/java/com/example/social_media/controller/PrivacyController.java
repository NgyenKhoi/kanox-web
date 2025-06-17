package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.privacy.CreateCustomListDto;
import com.example.social_media.dto.privacy.CustomListMemberDto;
import com.example.social_media.entity.CustomPrivacyList;
import com.example.social_media.entity.PrivacySetting;
import com.example.social_media.entity.User;
import com.example.social_media.service.CustomUserDetailsService;
import com.example.social_media.service.PrivacyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping(URLConfig.PRIVACY_BASE)
public class PrivacyController {
    private static final Logger logger = LoggerFactory.getLogger(PrivacyController.class);
    private final PrivacyService privacyService;
    private final CustomUserDetailsService customUserDetailsService;

    public PrivacyController(PrivacyService privacyService, CustomUserDetailsService customUserDetailsService) {
        this.privacyService = privacyService;
        this.customUserDetailsService = customUserDetailsService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getPrivacySettings() {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            logger.debug("Fetching privacy settings for user: {}", currentUsername);
            User user = customUserDetailsService.getUserByUsername(currentUsername);
            PrivacySetting settings = privacyService.getPrivacySettingByUserId(user.getId());
            if (settings == null) {
                throw new IllegalArgumentException("Không tìm thấy cài đặt quyền riêng tư.");
            }
            Map<String, String> responseData = new HashMap<>();
            responseData.put("postVisibility", settings.getPostViewer() != null ? settings.getPostViewer() : "public");
            responseData.put("commentPermission", settings.getCommentViewer() != null ? settings.getCommentViewer() : "public");
            responseData.put("friendRequestPermission", settings.getMessageViewer() != null ? settings.getMessageViewer() : "friends");

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Lấy cài đặt thành công");
            response.put("data", responseData);
            logger.debug("Privacy settings response: {}", response);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Error fetching privacy settings: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Lỗi hệ thống: " + e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> updatePrivacySettings(@RequestBody Map<String, Object> body) {
        try {
            logger.debug("Updating privacy settings with body: {}", body);
            // Hỗ trợ cả { data: settings } và settings trực tiếp
            @SuppressWarnings("unchecked")
            Map<String, String> settings = (Map<String, String>) body.get("data");
            if (settings == null) {
                settings = new HashMap<>();
                // Nếu body là settings trực tiếp, copy các field
                for (Map.Entry<String, Object> entry : body.entrySet()) {
                    if (entry.getValue() instanceof String) {
                        settings.put(entry.getKey(), (String) entry.getValue());
                    }
                }
            }

            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = customUserDetailsService.getUserByUsername(currentUsername);
            PrivacySetting privacySetting = privacyService.getPrivacySettingByUserId(user.getId());
            if (privacySetting == null) {
                throw new IllegalArgumentException("Không tìm thấy cài đặt quyền riêng tư.");
            }

            String postVisibility = settings.getOrDefault("postVisibility", "public");
            String commentPermission = settings.getOrDefault("commentPermission", "public");
            String friendRequestPermission = settings.getOrDefault("friendRequestPermission", "friends");

            // Kiểm tra giá trị hợp lệ
            if (!List.of("public", "friends", "only_me", "custom").contains(postVisibility)) {
                throw new IllegalArgumentException("Giá trị postVisibility không hợp lệ: " + postVisibility);
            }
            if (!List.of("public", "friends", "only_me", "custom").contains(commentPermission)) {
                throw new IllegalArgumentException("Giá trị commentPermission không hợp lệ: " + commentPermission);
            }
            if (!List.of("public", "friends", "only_me").contains(friendRequestPermission)) {
                throw new IllegalArgumentException("Giá trị friendRequestPermission không hợp lệ: " + friendRequestPermission);
            }

            // Cập nhật cài đặt
            privacySetting.setPostViewer(postVisibility);
            privacySetting.setCommentViewer(commentPermission);
            privacySetting.setMessageViewer(friendRequestPermission);
            privacySetting.setUpdatedAt(Instant.now());
            privacyService.savePrivacySetting(privacySetting);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Cập nhật cài đặt thành công");
            logger.debug("Privacy settings updated successfully for user: {}", currentUsername);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Error updating privacy settings: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Lỗi hệ thống: " + e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping(URLConfig.CREATE_CUSTOM_LIST)
    public ResponseEntity<Map<String, Object>> getCustomLists() {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            logger.debug("Fetching custom lists for user: {}", currentUsername);
            User user = customUserDetailsService.getUserByUsername(currentUsername);
            List<CustomPrivacyList> lists = privacyService.getCustomLists(user.getId());
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Lấy danh sách thành công");
            response.put("data", lists);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Error fetching custom lists: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PostMapping(URLConfig.CREATE_CUSTOM_LIST)
    public ResponseEntity<Map<String, Object>> createCustomList(@RequestBody CreateCustomListDto dto) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            logger.debug("Creating custom list for user: {}", currentUsername);
            User user = customUserDetailsService.getUserByUsername(currentUsername);
            Integer listId = privacyService.createCustomList(user.getId(), dto.getListName());
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Danh sách tùy chỉnh được tạo thành công");
            response.put("listId", listId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Error creating custom list: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @DeleteMapping(URLConfig.CREATE_CUSTOM_LIST + "/{listId}")
    public ResponseEntity<Map<String, Object>> deleteCustomList(@PathVariable Integer listId) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            logger.debug("Deleting custom list {} for user: {}", listId, currentUsername);
            User user = customUserDetailsService.getUserByUsername(currentUsername);
            privacyService.deleteCustomList(user.getId(), listId);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Xóa danh sách thành công");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Error deleting custom list: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @GetMapping(URLConfig.ADD_MEMBER_TO_CUSTOM_LIST)
    public ResponseEntity<Map<String, Object>> getCustomListMembers(@PathVariable Integer listId) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            logger.debug("Fetching members of custom list {} for user: {}", listId, currentUsername);
            User user = customUserDetailsService.getUserByUsername(currentUsername);
            List<CustomListMemberDto> members = privacyService.getCustomListMembers(user.getId(), listId);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Lấy thành viên danh sách thành công");
            response.put("data", members);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Error fetching custom list members: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PostMapping(URLConfig.ADD_MEMBER_TO_CUSTOM_LIST)
    public ResponseEntity<Map<String, Object>> addMemberToCustomList(@PathVariable Integer listId, @RequestBody Map<String, Integer> body) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            logger.debug("Adding member to custom list {} for user: {}", listId, currentUsername);
            User user = customUserDetailsService.getUserByUsername(currentUsername);
            Integer memberId = body.get("memberId");
            privacyService.addMemberToCustomList(user.getId(), listId, memberId);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Thêm thành viên vào danh sách thành công");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Error adding member to custom list: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @DeleteMapping(URLConfig.ADD_MEMBER_TO_CUSTOM_LIST + "/{memberId}")
    public ResponseEntity<Map<String, Object>> removeMemberFromCustomList(@PathVariable Integer listId, @PathVariable Integer memberId) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            logger.debug("Removing member {} from custom list {} for user: {}", memberId, listId, currentUsername);
            User user = customUserDetailsService.getUserByUsername(currentUsername);
            privacyService.removeMemberFromCustomList(user.getId(), listId, memberId);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Xóa thành viên khỏi danh sách thành công");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Error removing member from custom list: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
}
