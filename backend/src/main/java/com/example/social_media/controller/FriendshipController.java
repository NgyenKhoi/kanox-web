package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.friend.*;
import com.example.social_media.dto.user.UserDto;
import com.example.social_media.dto.user.UserTagDto;
import com.example.social_media.entity.Friendship;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.FriendshipRepository;
import com.example.social_media.repository.UserRepository;
import com.example.social_media.service.FriendSuggestionService;
import com.example.social_media.service.FriendshipService;
import com.example.social_media.service.CustomUserDetailsService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(URLConfig.FRIENDSHIP_BASE)
public class FriendshipController {
    private final FriendshipService friendshipService;
    private final CustomUserDetailsService customUserDetailsService;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final FriendSuggestionService friendSuggestionService;

    public FriendshipController(
            FriendshipService friendshipService,
            CustomUserDetailsService customUserDetailsService,
            UserRepository userRepository,
            FriendshipRepository friendshipRepository,
            FriendSuggestionService friendSuggestionService) {
        this.friendshipService = friendshipService;
        this.customUserDetailsService = customUserDetailsService;
        this.userRepository = userRepository;
        this.friendshipRepository = friendshipRepository;
        this.friendSuggestionService = friendSuggestionService;
    }

    @PostMapping(URLConfig.SEND_FRIEND_REQUEST)
    public ResponseEntity<?> sendFriendRequest(
            @PathVariable Integer receiverId
    ) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            friendshipService.sendFriendRequest(currentUser.getId(), receiverId);
            return ResponseEntity.ok(Map.of("message", "Friend request sent successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        } catch (UserNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @PutMapping(URLConfig.ACCEPT_FRIEND_REQUEST)
    public ResponseEntity<?> acceptFriendRequest(
            @PathVariable Integer requesterId
    ) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            friendshipService.acceptFriendRequest(currentUser.getId(), requesterId);
            return ResponseEntity.ok(Map.of("message", "Friend request accepted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        } catch (UserNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @PutMapping(URLConfig.REJECT_FRIEND_REQUEST)
    public ResponseEntity<?> rejectFriendRequest(
            @PathVariable Integer requesterId
    ) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            friendshipService.rejectFriendRequest(currentUser.getId(), requesterId);
            return ResponseEntity.ok(Map.of("message", "Friend request rejected successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        } catch (UserNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @DeleteMapping(URLConfig.CANCEL_FRIENDSHIP)
    public ResponseEntity<?> cancelFriendship(
            @PathVariable Integer friendId
    ) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            friendshipService.cancelFriendship(currentUser.getId(), friendId);
            return ResponseEntity.ok(Map.of("message", "Friendship cancelled successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        } catch (UserNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @GetMapping(URLConfig.GET_FRIENDS)
    public ResponseEntity<?> getFriends(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            if (currentUsername == null) {
                throw new IllegalArgumentException("Không tìm thấy thông tin người dùng hiện tại");
            }
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            if (currentUser == null || currentUser.getId() == null) {
                throw new IllegalArgumentException("Thông tin người dùng hiện tại không hợp lệ");
            }
            if (userId == null) {
                throw new IllegalArgumentException("userId không hợp lệ");
            }
            Pageable pageable = PageRequest.of(page, size);
            PageResponseDto<UserTagDto> friends = friendshipService.getFriends(userId, currentUser.getId(), pageable);
            return ResponseEntity.ok(Map.of("message", "Friends retrieved successfully", "data", friends));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        } catch (Exception e) {
            System.err.println("Exception: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", "Lỗi hệ thống: " + e.getMessage()));
        }
    }

    @GetMapping(URLConfig.GET_SENT_PENDING_REQUESTS)
    public ResponseEntity<?> getSentPendingRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            Pageable pageable = PageRequest.of(page, size);
            PageResponseDto<UserTagDto> sentRequests = friendshipService.getSentPendingRequests(currentUser.getId(), pageable);
            return ResponseEntity.ok(Map.of("message", "Sent pending requests retrieved successfully", "data", sentRequests));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @GetMapping(URLConfig.GET_RECEIVED_PENDING_REQUESTS)
    public ResponseEntity<?> getReceivedPendingRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            Pageable pageable = PageRequest.of(page, size);
            PageResponseDto<UserTagDto> receivedRequests = friendshipService.getReceivedPendingRequests(currentUser.getId(), pageable);
            return ResponseEntity.ok(Map.of("message", "Received pending requests retrieved successfully", "data", receivedRequests));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @GetMapping(URLConfig.GET_FRIENDSHIP_STATUS)
    public ResponseEntity<?> getFriendshipStatus(@PathVariable Integer targetId) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            User targetUser = userRepository.findById(targetId)
                    .orElseThrow(() -> new UserNotFoundException("User not found"));
            Friendship friendship = friendshipRepository.findByUserAndFriendAndStatus(currentUser, targetUser, true)
                    .orElseGet(() -> friendshipRepository.findByUserAndFriendAndStatus(targetUser, currentUser, true)
                            .orElse(null));
            String status = (friendship == null) ? "none" : friendship.getFriendshipStatus();
            if ("pending".equals(status)) {
                boolean isSender = friendship.getUser().getId().equals(currentUser.getId());
                status = isSender ? "pendingSent" : "pendingReceived";
            }
            return ResponseEntity.ok(Map.of("status", status));
        } catch (UserNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @GetMapping("/suggestions")
    public ResponseEntity<?> getFriendSuggestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            List<UserDto> suggestions = friendSuggestionService.getFriendSuggestions(currentUser.getId());
            return ResponseEntity.ok(Map.of("message", "Friend suggestions retrieved successfully", "data", suggestions));
        } catch (IllegalArgumentException | UserNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", "Lỗi hệ thống: " + e.getMessage()));
        }
    }
}