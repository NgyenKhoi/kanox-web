package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.friend.PageResponseDto;
import com.example.social_media.dto.user.UserProfileDto;
import com.example.social_media.dto.user.UserTagDto;
import com.example.social_media.dto.user.UserUpdatePrivacyDto;
import com.example.social_media.dto.user.UserUpdateProfileDto;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.service.CustomUserDetailsService;
import com.example.social_media.service.FollowService;
import com.example.social_media.service.FriendshipService;
import com.example.social_media.service.UserProfileService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
    // GET api user profile
    @GetMapping(URLConfig.PROFILE)
    public ResponseEntity<?> getUserProfile(@PathVariable("username") String username) {
        try {
            UserProfileDto userProfileDto = userProfileService.getUserProfile(username);
            return ResponseEntity.ok(userProfileDto);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body("User not found");
        }
    }

    @PutMapping(URLConfig.PROFILE)
    public ResponseEntity<?> updateUserProfile(
            @PathVariable("username") String username,
            @RequestBody UserUpdateProfileDto updateDto) {
        try {
            UserProfileDto updatedProfile = userProfileService.updateUserProfile(username, updateDto);
            return ResponseEntity.ok(updatedProfile);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body("User not found");
        }
    }

    // Thêm endpoint để lấy UserTagDto cho tag người dùng
    @GetMapping("/username/{username}")
    public ResponseEntity<?> getUserByUsername(@PathVariable String username) {
        try {
            UserTagDto userTagDto = userProfileService.getUserTagByUsername(username);
            return ResponseEntity.ok(userTagDto);
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(404).body("User not found");
        }
    }

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
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

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
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

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
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }
    @PutMapping("/profile/{username}/privacy")
    public ResponseEntity<?> updateProfilePrivacy(
            @PathVariable String username,
            @RequestBody UserUpdatePrivacyDto privacyDto
    ) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            if (!currentUser.getUsername().equals(username)) {
                throw new IllegalArgumentException("Cannot update privacy settings for another user");
            }
            userProfileService.updateProfilePrivacy(currentUser.getId(), privacyDto.getPrivacySetting(), privacyDto.getCustomListId());
            return ResponseEntity.ok(Map.of("message", "Privacy settings updated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }
}