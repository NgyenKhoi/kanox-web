package com.example.social_media.controller;

import com.example.social_media.dto.notification.NotificationDto;
import com.example.social_media.entity.Notification;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.service.CustomUserDetailsService;
import com.example.social_media.service.NotificationService;
import com.example.social_media.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    private final UserService userService;
    private final NotificationService notificationService;
    private final CustomUserDetailsService customUserDetailsService;

    public AdminController(
            UserService userService,
            NotificationService notificationService,
            CustomUserDetailsService customUserDetailsService
    ) {
        this.userService = userService;
        this.notificationService = notificationService;
        this.customUserDetailsService = customUserDetailsService;
    }

    // === QUẢN LÝ NGƯỜI DÙNG ===
    
    // Lấy danh sách người dùng
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<User> users = userService.getAllUsers(pageable, search);
            return ResponseEntity.ok(Map.of("message", "Users retrieved successfully", "data", users));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving users", "error", e.getMessage()));
        }
    }

    // Lấy thông tin một người dùng
    @GetMapping("/users/{userId}")
    public ResponseEntity<?> getUserInfo(@PathVariable Integer userId) {
        try {
            User user = userService.getUserById(userId);
            return ResponseEntity.ok(Map.of("message", "User details retrieved successfully", "data", user));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found", "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving user details", "error", e.getMessage()));
        }
    }

    // Cập nhật thông tin người dùng
    @PutMapping("/users/{userId}")
    public ResponseEntity<?> updateUser(@PathVariable Integer userId, @RequestBody User userUpdate) {
        try {
            User updatedUser = userService.updateUser(userId, userUpdate);
            return ResponseEntity.ok(Map.of("message", "User updated successfully", "data", updatedUser));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found", "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error updating user", "error", e.getMessage()));
        }
    }

    // Cập nhật trạng thái người dùng (khóa/mở khóa)
    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<?> updateUserStatus(
            @PathVariable Integer userId, 
            @RequestParam Boolean status
    ) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User admin = customUserDetailsService.getUserByUsername(currentUsername);
            
            User updatedUser = userService.updateUserStatus(userId, status);
            String statusMessage = status ? "unlocked" : "locked";
            
            return ResponseEntity.ok(Map.of(
                    "message", "User account " + statusMessage + " successfully", 
                    "data", updatedUser
            ));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found", "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error updating user status", "error", e.getMessage()));
        }
    }

    // Gửi thông báo cho người dùng
    @PostMapping("/users/send-notification")
    public ResponseEntity<?> sendNotification(@RequestBody Map<String, Object> notificationRequest) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User admin = customUserDetailsService.getUserByUsername(currentUsername);
            
            Integer userId = (Integer) notificationRequest.get("userId");
            String message = (String) notificationRequest.get("message");
            String notificationType = (String) notificationRequest.get("type");
            
            notificationService.sendNotification(
                    userId,
                    notificationType, 
                    message, 
                    admin.getId(), 
                    "USER"
            );
            
            return ResponseEntity.ok(Map.of("message", "Notification sent successfully"));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found", "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error sending notification", "error", e.getMessage()));
        }
    }
    
    // === CÁC TÍNH NĂNG ADMIN KHÁC CÓ THỂ ĐƯỢC THÊM VÀO ĐÂY ===
} 