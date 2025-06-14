package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.block.BlockedUserDto;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.service.BlockService;
import com.example.social_media.service.CustomUserDetailsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        } catch (UserNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        } catch (Exception distancia) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", distancia.getMessage(), "errors", Map.of()));
        }
    }

    @DeleteMapping(URLConfig.UNBLOCK_USER)
    public ResponseEntity<?> unblockUser(@PathVariable Integer blockedUserId) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            blockService.unblockUser(currentUser.getId(), blockedUserId);
            return ResponseEntity.ok(Map.of("message", "User unblocked successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        } catch (UserNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getBlockedUsers() {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            List<BlockedUserDto> blockedUsers = blockService.getBlockedUsers(currentUser.getId());
            return ResponseEntity.ok(Map.of("data", blockedUsers));
        } catch (UserNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @GetMapping(URLConfig.CHECK_BLOCK_STATUS)
    public ResponseEntity<?> checkBlockStatus(@PathVariable Integer blockedUserId) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            boolean isBlocked = blockService.isUserBlocked(currentUser.getId(), blockedUserId);
            return ResponseEntity.ok(Map.of("isBlocked", isBlocked));
        } catch (UserNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }
}