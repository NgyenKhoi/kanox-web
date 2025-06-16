package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.privacy.CreateCustomListDto;
import com.example.social_media.dto.privacy.CustomListMemberDto;
import com.example.social_media.entity.CustomPrivacyList;
import com.example.social_media.entity.PrivacySetting;
import com.example.social_media.entity.User;
import com.example.social_media.service.CustomUserDetailsService;
import com.example.social_media.service.PrivacyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping(URLConfig.PRIVACY_BASE)
public class PrivacyController {
    private final PrivacyService privacyService;
    private final CustomUserDetailsService customUserDetailsService;

    public PrivacyController(PrivacyService privacyService, CustomUserDetailsService customUserDetailsService) {
        this.privacyService = privacyService;
        this.customUserDetailsService = customUserDetailsService;
    }

    @GetMapping
    public ResponseEntity<?> getPrivacySettings() {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = customUserDetailsService.getUserByUsername(currentUsername);
            PrivacySetting settings = privacyService.getPrivacySettingByUserId(user.getId());
            if (settings == null) {
                throw new IllegalArgumentException("Không tìm thấy cài đặt quyền riêng tư.");
            }
            Map<String, String> responseData = new HashMap<>();
            responseData.put("postVisibility", settings.getPostViewer() != null ? settings.getPostViewer() : "public");
            responseData.put("commentPermission", settings.getCommentViewer() != null ? settings.getCommentViewer() : "public");
            responseData.put("friendRequestPermission", settings.getMessageViewer() != null ? settings.getMessageViewer() : "friends");
            return ResponseEntity.ok(Map.of("message", "Lấy cài đặt thành công", "data", responseData));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @PutMapping
    public ResponseEntity<?> updatePrivacySettings(@RequestBody Map<String, Map<String, String>> body) {
        try {
            Map<String, String> settings = body.getOrDefault("data", Map.of());
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = customUserDetailsService.getUserByUsername(currentUsername);
            PrivacySetting privacySetting = privacyService.getPrivacySettingByUserId(user.getId());
            if (privacySetting == null) {
                throw new IllegalArgumentException("Không tìm thấy cài đặt quyền riêng tư.");
            }

            String postVisibility = settings.getOrDefault("postVisibility", "public");
            String commentPermission = settings.getOrDefault("commentPermission", "public");
            String friendRequestPermission = settings.getOrDefault("friendRequestPermission", "friends");

            // Kiểm tra giá trị hợp lệ theo schema
            if (!List.of("public", "friends", "only_me", "custom").contains(postVisibility)) {
                throw new IllegalArgumentException("Giá trị postVisibility không hợp lệ.");
            }
            if (!List.of("public", "friends", "only_me", "custom").contains(commentPermission)) {
                throw new IllegalArgumentException("Giá trị commentPermission không hợp lệ.");
            }
            if (!List.of("public", "friends", "only_me").contains(friendRequestPermission)) {
                throw new IllegalArgumentException("Giá trị friendRequestPermission không hợp lệ.");
            }

            // Cập nhật cài đặt
            privacySetting.setPostViewer(postVisibility);
            privacySetting.setCommentViewer(commentPermission);
            privacySetting.setMessageViewer(friendRequestPermission);
            privacySetting.setUpdatedAt(Instant.now());
            privacyService.savePrivacySetting(privacySetting);

            return ResponseEntity.ok(Map.of("message", "Cập nhật cài đặt thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @GetMapping(URLConfig.CREATE_CUSTOM_LIST)
    public ResponseEntity<?> getCustomLists() {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = customUserDetailsService.getUserByUsername(currentUsername);
            List<CustomPrivacyList> lists = privacyService.getCustomLists(user.getId());
            return ResponseEntity.ok(Map.of("message", "Lấy danh sách thành công", "data", lists));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @PostMapping(URLConfig.CREATE_CUSTOM_LIST)
    public ResponseEntity<?> createCustomList(@RequestBody CreateCustomListDto dto) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = customUserDetailsService.getUserByUsername(currentUsername);
            Integer listId = privacyService.createCustomList(user.getId(), dto.getListName());
            return ResponseEntity.ok(Map.of("message", "Danh sách tùy chỉnh được tạo thành công", "listId", listId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @DeleteMapping(URLConfig.CREATE_CUSTOM_LIST + "/{listId}")
    public ResponseEntity<?> deleteCustomList(@PathVariable Integer listId) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = customUserDetailsService.getUserByUsername(currentUsername);
            privacyService.deleteCustomList(user.getId(), listId);
            return ResponseEntity.ok(Map.of("message", "Xóa danh sách thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @GetMapping(URLConfig.ADD_MEMBER_TO_CUSTOM_LIST)
    public ResponseEntity<?> getCustomListMembers(@PathVariable Integer listId) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = customUserDetailsService.getUserByUsername(currentUsername);
            List<CustomListMemberDto> members = privacyService.getCustomListMembers(user.getId(), listId);
            return ResponseEntity.ok(Map.of("message", "Lấy thành viên danh sách thành công", "data", members));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @PostMapping(URLConfig.ADD_MEMBER_TO_CUSTOM_LIST)
    public ResponseEntity<?> addMemberToCustomList(@PathVariable Integer listId, @RequestBody Map<String, Integer> body) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = customUserDetailsService.getUserByUsername(currentUsername);
            Integer memberId = body.get("memberId");
            privacyService.addMemberToCustomList(user.getId(), listId, memberId);
            return ResponseEntity.ok(Map.of("message", "Thêm thành viên vào danh sách thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @DeleteMapping(URLConfig.ADD_MEMBER_TO_CUSTOM_LIST + "/{memberId}")
    public ResponseEntity<?> removeMemberFromCustomList(@PathVariable Integer listId, @PathVariable Integer memberId) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = customUserDetailsService.getUserByUsername(currentUsername);
            privacyService.removeMemberFromCustomList(user.getId(), listId, memberId);
            return ResponseEntity.ok(Map.of("message", "Xóa thành viên khỏi danh sách thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }
}