package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.report.ReportResponseDto;
import com.example.social_media.dto.report.UpdateReportStatusRequestDto;
import com.example.social_media.dto.report.ReportHistoryDto;
import com.example.social_media.entity.*;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.report.ReportHistoryRepository;
import com.example.social_media.repository.report.ReportRepository;
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
            System.out.println("=== [DEBUG] AdminController.updateUserStatus called ===");
            System.out.println("User ID: " + userId);
            System.out.println("Status: " + status);
            
            if (userId == null || userId <= 0) {
                System.out.println("=== [ERROR] Invalid userId: " + userId + " ===");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Invalid user ID", "error", "User ID must be a positive integer"));
            }
            
            if (status == null) {
                System.out.println("=== [ERROR] Status is null ===");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Status is required", "error", "Status cannot be null"));
            }
            
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            System.out.println("Current admin username: " + currentUsername);
            
            User admin = customUserDetailsService.getUserByUsername(currentUsername);
            System.out.println("Admin found: " + admin.getUsername());

            User updatedUser = userService.updateUserStatus(userId, status, admin.getId());
            String statusMessage = status ? "unlocked" : "locked";
            
            System.out.println("=== [DEBUG] AdminController.updateUserStatus completed successfully ===");
            return ResponseEntity.ok(Map.of(
                    "message", "User account " + statusMessage + " successfully",
                    "data", updatedUser
            ));
        } catch (UserNotFoundException e) {
            System.out.println("=== [ERROR] UserNotFoundException in AdminController: " + e.getMessage() + " ===");
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found", "error", e.getMessage()));
        } catch (RuntimeException e) {
            System.out.println("=== [ERROR] RuntimeException in AdminController: " + e.getMessage() + " ===");
            e.printStackTrace();
            if (e.getCause() != null) {
                System.out.println("=== [ERROR] Root cause: " + e.getCause().getMessage() + " ===");
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error updating user status", "error", e.getMessage(), "rootCause", e.getCause() != null ? e.getCause().getMessage() : "Unknown"));
        } catch (Exception e) {
            System.out.println("=== [ERROR] Exception in AdminController: " + e.getMessage() + " ===");
            e.printStackTrace();
            if (e.getCause() != null) {
                System.out.println("=== [ERROR] Root cause: " + e.getCause().getMessage() + " ===");
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error updating user status", "error", e.getMessage(), "rootCause", e.getCause() != null ? e.getCause().getMessage() : "Unknown"));
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
            @RequestParam(required = false) String processingStatusId,
            @RequestParam(required = false) Integer targetTypeId,
            @RequestParam(required = false) String reporterType
    ) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<ReportResponseDto> reports;
            if ("AI".equals(reporterType)) {
                Integer statusId = processingStatusId != null && !processingStatusId.isEmpty() ? Integer.parseInt(processingStatusId) : null;
                reports = reportService.getReportsByReporterTypeAIAndTargetTypeId(targetTypeId, statusId, pageable);
            } else if (targetTypeId != null && processingStatusId != null && !processingStatusId.isEmpty()) {
                Integer statusId = Integer.parseInt(processingStatusId);
                reports = reportService.getReportsByTargetTypeIdAndProcessingStatusId(targetTypeId, statusId, pageable);
            } else if (targetTypeId != null) {
                reports = reportService.getReportsByTargetTypeId(targetTypeId, pageable);
            } else if (processingStatusId != null && !processingStatusId.isEmpty()) {
                Integer statusId = Integer.parseInt(processingStatusId);
                reports = reportService.getReportsByProcessingStatusId(statusId, pageable);
            } else {
                reports = reportService.getReportsPaged(true, pageable);
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
            System.out.println("=== [DEBUG] AdminController.updateReportStatus called ===");
            System.out.println("Report ID: " + reportId);
            System.out.println("Request processingStatusId: " + (request != null ? request.getProcessingStatusId() : "null"));
            
            if (reportId == null || reportId <= 0) {
                System.out.println("=== [ERROR] Invalid reportId: " + reportId + " ===");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Invalid report ID", "error", "Report ID must be a positive integer"));
            }
            
            if (request == null) {
                System.out.println("=== [ERROR] Request is null ===");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Request body is required", "error", "Request is null"));
            }
            
            if (request.getProcessingStatusId() == null) {
                System.out.println("=== [ERROR] ProcessingStatusId is null ===");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Processing status ID is required", "error", "ProcessingStatusId is null"));
            }
            
            reportService.updateReportStatus(reportId, request);
            
            System.out.println("=== [DEBUG] AdminController.updateReportStatus completed successfully ===");
            return ResponseEntity.ok(Map.of("message", "Report status updated successfully"));
        } catch (UserNotFoundException e) {
            System.out.println("=== [ERROR] UserNotFoundException in AdminController: " + e.getMessage() + " ===");
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Admin not found", "error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            System.out.println("=== [ERROR] IllegalArgumentException in AdminController: " + e.getMessage() + " ===");
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Invalid request", "error", e.getMessage()));
        } catch (RuntimeException e) {
            System.out.println("=== [ERROR] RuntimeException in AdminController: " + e.getMessage() + " ===");
            e.printStackTrace();
            if (e.getCause() != null) {
                System.out.println("=== [ERROR] Root cause: " + e.getCause().getMessage() + " ===");
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error updating report status", "error", e.getMessage(), "rootCause", e.getCause() != null ? e.getCause().getMessage() : "Unknown"));
        } catch (Exception e) {
            System.out.println("=== [ERROR] Exception in AdminController: " + e.getMessage() + " ===");
            e.printStackTrace();
            if (e.getCause() != null) {
                System.out.println("=== [ERROR] Root cause: " + e.getCause().getMessage() + " ===");
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error updating report status", "error", e.getMessage(), "rootCause", e.getCause() != null ? e.getCause().getMessage() : "Unknown"));
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
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Lỗi khi lấy lịch sử báo cáo: " + e.getMessage(),
                    "errors", Map.of()
            ));
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



    @GetMapping(URLConfig.GET_UNREAD_REPORT)
    public ResponseEntity<?> getUnreadReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<ReportResponseDto> reports = reportService.getReportsByProcessingStatusId(1, pageable);
            return ResponseEntity.ok(Map.of("data", reports));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Lỗi khi lấy danh sách báo cáo chưa đọc: " + e.getMessage(),
                    "errors", Map.of()
            ));
        }
    }

}