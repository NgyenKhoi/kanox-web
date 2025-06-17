package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.friend.PageResponseDto;
import com.example.social_media.dto.user.*;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.service.*;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping(URLConfig.USER_MANAGEMENT_BASE)
public class UserController {

    private final UserProfileService userProfileService;
    private final FriendshipService friendshipService;
    private final FollowService followService;
    private final CustomUserDetailsService customUserDetailsService;

    public UserController(
            UserProfileService userProfileService,
            FriendshipService friendshipService,
            FollowService followService,
            CustomUserDetailsService customUserDetailsService
    ) {
        this.userProfileService = userProfileService;
        this.friendshipService = friendshipService;
        this.followService = followService;
        this.customUserDetailsService = customUserDetailsService;
    }

    // Lấy profile người dùng
    @GetMapping(URLConfig.PROFILE)
    public ResponseEntity<?> getUserProfile(@PathVariable("username") String username) {
        try {
            UserProfileDto userProfileDto = userProfileService.getUserProfile(username);
            return ResponseEntity.ok(userProfileDto);
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    // Cập nhật profile (thông tin + avatar nếu có)
    @PutMapping(value = URLConfig.PROFILE, consumes = "multipart/form-data")
    public ResponseEntity<?> updateUserProfile(
            @PathVariable("username") String username,
            @RequestPart("data") UserUpdateProfileDto updateDto,
            @RequestPart(value = "avatar", required = false) MultipartFile avatarFile
    ) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            if (!username.equals(currentUsername)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Không thể chỉnh sửa profile người khác.");
            }

            UserProfileDto updatedProfile = userProfileService.updateUserProfile(username, updateDto, avatarFile);
            return ResponseEntity.ok(updatedProfile);
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload avatar");
        }
    }

    // Lấy thông tin dạng tag (dùng để mention/tag user)
    @GetMapping("/username/{username}")
    public ResponseEntity<?> getUserByUsername(@PathVariable String username) {
        try {
            UserTagDto userTagDto = userProfileService.getUserTagByUsername(username);
            return ResponseEntity.ok(userTagDto);
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
    }

    // Lấy danh sách bạn bè của người dùng
    @GetMapping("/{userId}/friends")
    public ResponseEntity<?> getFriends(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            Pageable pageable = PageRequest.of(page, size);
            PageResponseDto<UserTagDto> friends = friendshipService.getFriends(userId, currentUser.getId(), pageable);
            return ResponseEntity.ok(Map.of("message", "Friends retrieved successfully", "data", friends));
        } catch (UserNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    // Lấy danh sách người dùng đang theo dõi
    @GetMapping("/{userId}/following")
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
        } catch (UserNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    // Lấy danh sách người theo dõi
    @GetMapping("/{userId}/followers")
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
        } catch (UserNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    // Cập nhật quyền riêng tư của profile
    @PutMapping("/profile/{username}/privacy")
    public ResponseEntity<?> updateProfilePrivacy(
            @PathVariable String username,
            @RequestBody UserUpdatePrivacyDto privacyDto
    ) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            if (!currentUser.getUsername().equals(username)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Không thể cập nhật quyền riêng tư của người khác");
            }

            userProfileService.updateProfilePrivacy(currentUser.getId(), privacyDto.getPrivacySetting(), privacyDto.getCustomListId());
            return ResponseEntity.ok(Map.of("message", "Privacy settings updated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }
}
