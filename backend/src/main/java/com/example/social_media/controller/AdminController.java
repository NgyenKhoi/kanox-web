package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.report.ReportResponseDto;
import com.example.social_media.dto.report.UpdateReportStatusRequestDto;
import com.example.social_media.dto.report.ReportHistoryDto;
import com.example.social_media.dto.report.ReportReasonDto;
import com.example.social_media.entity.*;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.ReportHistoryRepository;
import com.example.social_media.repository.ReportRepository;
import com.example.social_media.service.CustomUserDetailsService;
import com.example.social_media.service.NotificationService;
import com.example.social_media.service.ReportService;
import com.example.social_media.service.UserService;
import com.example.social_media.service.GroupService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;


import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping(URLConfig.ADMIN_BASE)
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    private final UserService userService;
    private final NotificationService notificationService;
    private final CustomUserDetailsService customUserDetailsService;
    private final ReportService reportService;
    private final ReportRepository reportRepository;
    private final ReportHistoryRepository reportHistoryRepository;
    private final GroupService groupService;


    public AdminController(
            UserService userService,
            NotificationService notificationService,
            CustomUserDetailsService customUserDetailsService,
            ReportService reportService,
            ReportRepository reportRepository,
            ReportHistoryRepository reportHistoryRepository,
            GroupService groupService

    ) {
        this.userService = userService;
        this.notificationService = notificationService;
        this.customUserDetailsService = customUserDetailsService;
        this.reportService = reportService;
        this.reportRepository = reportRepository;
        this.reportHistoryRepository = reportHistoryRepository;
        this.groupService = groupService;

    }

    @GetMapping(URLConfig.GET_ALL_USER)
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

    @GetMapping(URLConfig.MANAGE_USER_INFO)
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

    @PutMapping(URLConfig.MANAGE_USER_INFO)
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

    @PatchMapping(URLConfig.UPDATE_USER_STATUS)
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

    @PostMapping(URLConfig.SEND_NOTIFICATION_FOR_USER)
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

    @GetMapping(URLConfig.GET_REPORTS)
    public ResponseEntity<?> getReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String processingStatusId
    ) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<ReportResponseDto> reports;
            if (processingStatusId.isEmpty()) {
                reports = reportService.getReportsPaged(true, pageable);
            } else {
                Integer statusId = Integer.parseInt(processingStatusId);
                reports = reportService.getReportsByProcessingStatusId(statusId, pageable);
            }
            return ResponseEntity.ok(Map.of("message", "Reports retrieved successfully", "data", reports));
        } catch (NumberFormatException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Invalid processingStatusId", "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving reports", "error", e.getMessage()));
        }
    }

    @PutMapping(URLConfig.UPDATE_REPORT_STATUS)
    public ResponseEntity<?> updateReportStatus(
            @PathVariable Integer reportId,
            @RequestBody UpdateReportStatusRequestDto request
    ) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User admin = customUserDetailsService.getUserByUsername(currentUsername);
            request.setAdminId(admin.getId());
            reportService.updateReportStatus(reportId, request);
            return ResponseEntity.ok(Map.of("message", "Report status updated successfully"));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Admin not found", "error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Unauthorized action", "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error updating report status", "error", e.getMessage()));
        }
    }

    @GetMapping(URLConfig.MANAGE_REPORT_BY_ID)
    public ResponseEntity<?> getReportById(@PathVariable Integer reportId) {
        try {
            ReportResponseDto report = reportService.getReportById(reportId);
            return ResponseEntity.ok(Map.of("message", "Report retrieved successfully", "data", report));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Report not found", "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving report", "error", e.getMessage()));
        }
    }

    @DeleteMapping(URLConfig.MANAGE_REPORT_BY_ID)
    public ResponseEntity<?> deleteReport(@PathVariable Integer reportId) {
        try {
            reportService.deleteReport(reportId);
            return ResponseEntity.ok(Map.of("message", "Report deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Report not found", "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error deleting report", "error", e.getMessage()));
        }
    }

    @GetMapping(URLConfig.GET_REPORT_HISTORY)
    public ResponseEntity<?> getReportHistory(@PathVariable Integer reportId) {
        try {
            List<ReportHistory> history = reportHistoryRepository.findByReportId(reportId);
            List<ReportHistoryDto> historyDtos = history.stream()
                    .map(this::convertToReportHistoryDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(historyDtos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving report history", "error", e.getMessage()));
        }
    }

    private ReportHistoryDto convertToReportHistoryDto(ReportHistory history) {
        ReportHistoryDto dto = new ReportHistoryDto();
        dto.setId(history.getId());
        dto.setReporterId(history.getReporter() != null ? history.getReporter().getId() : null);
        dto.setReporterUsername(history.getReporter() != null ? history.getReporter().getUsername() : null);
        dto.setReportId(history.getReport() != null ? history.getReport().getId() : null);
        dto.setProcessingStatusId(history.getProcessingStatus() != null ? history.getProcessingStatus().getId() : null);
        dto.setProcessingStatusName(history.getProcessingStatus() != null ? history.getProcessingStatus().getName() : null);
        dto.setActionTime(history.getActionTime());
        dto.setStatus(history.getStatus());
        return dto;
    }
    @DeleteMapping(URLConfig.DELETE_GROUP_BY_ADMIN)
    public ResponseEntity<?> deleteGroupByAdmin(@PathVariable Integer groupId) {
        try {
            groupService.deleteGroupAsAdmin(groupId);
            return ResponseEntity.ok(Map.of("message", "Group deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Group not found", "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error deleting group", "error", e.getMessage()));
        }
    }

}