package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.notification.*;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.service.CustomUserDetailsService;
import com.example.social_media.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(URLConfig.NOTIFICATION_BASE)
public class NotificationController {
    private final NotificationService notificationService;
    private final CustomUserDetailsService customUserDetailsService;

    public NotificationController(
            NotificationService notificationService,
            CustomUserDetailsService customUserDetailsService
    ) {
        this.notificationService = notificationService;
        this.customUserDetailsService = customUserDetailsService;
    }

    @GetMapping
    public ResponseEntity<?> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            Pageable pageable = PageRequest.of(page, size);
            Page<NotificationDto> notifications = notificationService.getNotifications(currentUser.getId(), pageable);
            return ResponseEntity.ok(Map.of("message", "Notifications retrieved successfully", "data", notifications));
        } catch (UserNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @PutMapping(URLConfig.MARK_READ_NOTIFICATION)
    public ResponseEntity<?> markNotificationAsRead(@PathVariable Integer id) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            notificationService.markAsRead(id, currentUser.getId(), "read");
            return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
        } catch (UserNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }

    @PutMapping(URLConfig.MARK_UNREAD)
    public ResponseEntity<?> markNotificationAsUnread(@PathVariable Integer id) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            notificationService.markAsRead(id, currentUser.getId(), "unread");
            return ResponseEntity.ok(Map.of("message", "Notification marked as unread"));
        } catch (UserNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        }
    }
}