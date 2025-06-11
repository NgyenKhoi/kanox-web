package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.service.BlockService;
import com.example.social_media.service.CustomUserDetailsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(URLConfig.BLOCK_BASE)
public class BlockController {
    private final BlockService blockService;
    private final CustomUserDetailsService customUserDetailsService;

    public BlockController(BlockService blockService, CustomUserDetailsService customUserDetailsService) {
        this.blockService = blockService;
        this.customUserDetailsService = customUserDetailsService;
    }

    @PostMapping(URLConfig.BLOCK_USER)
    public ResponseEntity<?> blockUser(@PathVariable Integer blockedUserId) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            blockService.blockUser(currentUser.getId(), blockedUserId);
            return ResponseEntity.ok(Map.of("message", "User blocked successfully"));
        } catch (IllegalArgumentException | UserNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @DeleteMapping(URLConfig.UNBLOCK_USER)
    public ResponseEntity<?> unblockUser(@PathVariable Integer blockedUserId) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            blockService.unblockUser(currentUser.getId(), blockedUserId);
            return ResponseEntity.ok(Map.of("message", "User unblocked successfully"));
        } catch (IllegalArgumentException | UserNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getBlockedUsers() {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            return ResponseEntity.ok(Map.of("data", blockService.getBlockedUsers(currentUser.getId())));
        } catch (UserNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }
}