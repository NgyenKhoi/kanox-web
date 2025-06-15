package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.privacy.CreateCustomListDto;
import com.example.social_media.dto.privacy.CustomListMemberDto;
import com.example.social_media.entity.CustomPrivacyList;
import com.example.social_media.entity.User;
import com.example.social_media.service.CustomUserDetailsService;
import com.example.social_media.service.PrivacyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(URLConfig.PRIVACY_BASE)
public class PrivacyController {
    private final PrivacyService privacyService;
    private final CustomUserDetailsService customUserDetailsService;

    public PrivacyController(PrivacyService privacyService, CustomUserDetailsService customUserDetailsService) {
        this.privacyService = privacyService;
        this.customUserDetailsService = customUserDetailsService;
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