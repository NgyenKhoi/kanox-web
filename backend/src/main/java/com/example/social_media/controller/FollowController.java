package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.friend.PageResponseDto;
import com.example.social_media.dto.user.UserTagDto;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.FollowRepository;
import com.example.social_media.service.CustomUserDetailsService;
import com.example.social_media.service.FollowService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(URLConfig.FOLLOW_BASE)
public class FollowController {
    private final FollowService followService;
    private final CustomUserDetailsService customUserDetailsService;
    private final FollowRepository followRepository;

    public FollowController(
            FollowService followService,
            CustomUserDetailsService customUserDetailsService,
            FollowRepository followRepository
    ) {
        this.followService = followService;
        this.customUserDetailsService = customUserDetailsService;
        this.followRepository = followRepository;
    }

    @PostMapping(URLConfig.FOLLOW_USER)
    public ResponseEntity<?> followUser(
            @PathVariable Integer followeeId
    ) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            followService.followUser(currentUser.getId(), followeeId);
            return ResponseEntity.ok(Map.of("message", "Followed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @DeleteMapping(URLConfig.UNFOLLOW_USER)
    public ResponseEntity<?> unfollowUser(
            @PathVariable Integer followeeId
    ) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            followService.unfollowUser(currentUser.getId(), followeeId);
            return ResponseEntity.ok(Map.of("message", "Unfollowed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @GetMapping(URLConfig.GET_FOLLOWING)
    public ResponseEntity<?> getFollowing(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            Pageable pageable = PageRequest.of(page, size);
            PageResponseDto<UserTagDto> following = followService.getFollowing(userId, currentUser.getId(), pageable);
            return ResponseEntity.ok(Map.of("message", "Following retrieved successfully", "data", following));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @GetMapping(URLConfig.GET_FOLLOWERS)
    public ResponseEntity<?> getFollowers(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            Pageable pageable = PageRequest.of(page, size);
            PageResponseDto<UserTagDto> followers = followService.getFollowers(userId, currentUser.getId(), pageable);
            return ResponseEntity.ok(Map.of("message", "Followers retrieved successfully", "data", followers));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @GetMapping(URLConfig.GET_FOLLOW_STATUS)
    public ResponseEntity<?> getFollowStatus(@PathVariable Integer targetId) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            User targetUser = customUserDetailsService.getUserByUsername(
                    customUserDetailsService.getUserByUsername(String.valueOf(targetId)).getUsername()
            );
            boolean isFollowing = followRepository.findByFollowerAndFolloweeAndStatus(currentUser, targetUser, true)
                    .isPresent();
            return ResponseEntity.ok(Map.of("isFollowing", isFollowing));
        } catch (UserNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }
}