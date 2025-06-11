package com.example.social_media.controller;

import com.example.social_media.dto.privacy.CreateCustomListDto;
import com.example.social_media.entity.CustomPrivacyListMemberId;
import com.example.social_media.entity.User;
import com.example.social_media.service.CustomUserDetailsService;
import com.example.social_media.service.PrivacyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.example.social_media.config.URLConfig;

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

    @PostMapping(URLConfig.CREATE_CUSTOM_LIST)
    public ResponseEntity<?> createCustomList(@RequestBody CreateCustomListDto dto) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = customUserDetailsService.getUserByUsername(currentUsername);
            Integer listId = privacyService.createCustomList(user.getId(), dto.getListName());
            return ResponseEntity.ok(Map.of("message", "Custom list created successfully", "listId", listId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @PostMapping(URLConfig.ADD_MEMBER_TO_CUSTOM_LIST)
    public ResponseEntity<?> addMemberToCustomList(@PathVariable CustomPrivacyListMemberId listId, @RequestBody User memberId) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = customUserDetailsService.getUserByUsername(currentUsername);
            privacyService.addMemberToCustomList(user.getId(), listId, memberId);
            return ResponseEntity.ok(Map.of("message", "Member added to custom list successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }
}
