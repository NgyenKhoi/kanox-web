package com.example.social_media.service;

import com.example.social_media.dto.report.CreateReportRequestDto;
import com.example.social_media.dto.report.ReportResponseDto;
import com.example.social_media.dto.report.UpdateReportStatusRequestDto;
import com.example.social_media.dto.report.ReportReasonDto;
import com.example.social_media.entity.*;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.*;
import com.example.social_media.repository.post_repository.PostRepository;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ReportReasonRepository reportReasonRepository;
    private final ReportStatusRepository reportStatusRepository;
    private final ReportHistoryRepository reportHistoryRepository;
    private final ReportLimitRepository reportLimitRepository;
    private final PostRepository postRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private static final int MAX_REPORTS_PER_DAY = 3;

    public ReportService(
            ReportRepository reportRepository,
            UserRepository userRepository,
            ReportReasonRepository reportReasonRepository,
            ReportStatusRepository reportStatusRepository,
            ReportHistoryRepository reportHistoryRepository,
            ReportLimitRepository reportLimitRepository,
            PostRepository postRepository,
            SimpMessagingTemplate messagingTemplate,
            NotificationService notificationService
    ) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.reportReasonRepository = reportReasonRepository;
        this.reportStatusRepository = reportStatusRepository;
        this.reportHistoryRepository = reportHistoryRepository;
        this.reportLimitRepository = reportLimitRepository;
        this.postRepository = postRepository;
        this.messagingTemplate = messagingTemplate;
        this.notificationService = notificationService;
    }

    @Transactional
    public void createReport(CreateReportRequestDto request) {
        User reporter = userRepository.findById(request.getReporterId())
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + request.getReporterId()));

        ReportReason reason = reportReasonRepository.findById(request.getReasonId())
                .orElseThrow(() -> new IllegalArgumentException("Report reason not found with id: " + request.getReasonId()));

        try {
            ReportStatus status = reportStatusRepository.findById(1)
                    .orElseThrow(() -> new IllegalArgumentException("Report status not found with id: 1"));

            Integer reportId = reportRepository.addReport(
                    request.getReporterId(),
                    request.getTargetId(),
                    request.getTargetTypeId(),
                    request.getReasonId(),
                    1,
                    true
            );

            Report report = reportRepository.findById(reportId)
                    .orElseThrow(() -> new IllegalArgumentException("Report not found with id: " + reportId));

            messagingTemplate.convertAndSend("/topic/admin/reports", Map.of(
                    "id", reportId,
                    "targetId", request.getTargetId(),
                    "targetTypeId", request.getTargetTypeId(),
                    "reporterUsername", reporter.getUsername(),
                    "reason", reason.getName(),
                    "createdAt", System.currentTimeMillis() / 1000,
                    "processingStatusId", status.getId(),
                    "processingStatusName", status.getName()
            ));

            ReportHistory history = new ReportHistory();
            history.setReporter(reporter);
            history.setReport(report);
            history.setProcessingStatus(status);
            history.setActionTime(Instant.now());
            history.setStatus(true);
            reportHistoryRepository.save(history);
        } catch (Exception e) {
            String errorMessage = e.getCause() instanceof SQLException ? e.getCause().getMessage() : e.getMessage();
            throw new RuntimeException("Lỗi khi tạo báo cáo: " + errorMessage);
        }
    }

    @Transactional(readOnly = true)
    public List<ReportResponseDto> getReports(Boolean status) {
        try {
            return reportRepository.getReports(status);
        } catch (Exception e) {
            throw new RuntimeException("Failed to retrieve reports: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Page<ReportResponseDto> getReportsPaged(Boolean status, Pageable pageable) {
        Page<Report> reportPage = reportRepository.findByStatus(status, pageable);
        return reportPage.map(this::convertToReportResponseDto);
    }

    @Transactional(readOnly = true)
    public Page<ReportResponseDto> getReportsByProcessingStatusId(Integer processingStatusId, Pageable pageable) {
        Page<Report> reportPage = reportRepository.findByProcessingStatusId(processingStatusId, pageable);
        return reportPage.map(this::convertToReportResponseDto);
    }

    @Transactional(readOnly = true)
    public Page<ReportResponseDto> getReportsByTargetTypeId(Integer targetTypeId, Pageable pageable) {
        Page<Report> reportPage = reportRepository.findByTargetTypeId(targetTypeId, pageable);
        return reportPage.map(this::convertToReportResponseDto);
    }

    @Transactional(readOnly = true)
    public Page<ReportResponseDto> getReportsByTargetTypeIdAndProcessingStatusId(Integer targetTypeId, Integer processingStatusId, Pageable pageable) {
        Page<Report> reportPage = reportRepository.findByTargetTypeIdAndProcessingStatusId(targetTypeId, processingStatusId, pageable);
        return reportPage.map(this::convertToReportResponseDto);
    }

    @Transactional
    public void updateReportStatus(Integer reportId, UpdateReportStatusRequestDto request) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        if (currentUsername == null) {
            throw new IllegalStateException("No authenticated user found");
        }
        User admin = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new UserNotFoundException("Admin not found with username: " + currentUsername));
        if (!admin.getIsAdmin()) {
            throw new IllegalArgumentException("User is not an admin");
        }

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found with id: " + reportId));
        ReportStatus status = reportStatusRepository.findById(request.getProcessingStatusId())
                .orElseThrow(() -> new IllegalArgumentException("Report status not found with id: " + request.getProcessingStatusId()));

        try {
            System.out.println("=== [DEBUG] Calling sp_UpdateReportStatus ===");
            System.out.println("reportId = " + reportId);
            System.out.println("adminId = " + admin.getId());
            System.out.println("statusId = " + request.getProcessingStatusId());
            System.out.println("report.getTargetType() = " + (report.getTargetType() != null ? report.getTargetType().getId() : "null"));
            System.out.println("report.getTargetId() = " + report.getTargetId());

            reportRepository.updateReportStatus(reportId, admin.getId(), request.getProcessingStatusId());

            String message;
            switch (request.getProcessingStatusId()) {
                case 1:
                    message = "Báo cáo của bạn (ID: " + reportId + ") đang chờ xử lý bởi " + admin.getDisplayName();
                    break;
                case 2:
                    message = "Báo cáo của bạn (ID: " + reportId + ") đang được xem xét bởi " + admin.getDisplayName();
                    break;
                case 3:
                    message = "Báo cáo của bạn (ID: " + reportId + ") đã được duyệt bởi " + admin.getDisplayName();
                    break;
                case 4:
                    message = "Báo cáo của bạn (ID: " + reportId + ") đã bị từ chối bởi " + admin.getDisplayName();
                    break;
                default:
                    message = "Báo cáo của bạn (ID: " + reportId + ") đã được cập nhật bởi " + admin.getDisplayName();
            }

            // Kiểm tra và thông báo nếu user bị tự động block (cho báo cáo được duyệt)
            if (request.getProcessingStatusId() == 3 && report.getTargetType() != null) {
                final Integer targetUserId;
                
                // Xác định user ID cần kiểm tra dựa trên loại báo cáo
                if (report.getTargetType().getId() == 4) {
                    // Báo cáo user - dùng trực tiếp targetId
                    targetUserId = report.getTargetId();
                    System.out.println("=== [DEBUG] User report - Target User ID: " + targetUserId + " ===");
                } else if (report.getTargetType().getId() == 1) {
                    // Báo cáo post - lấy owner ID từ post
                    try {
                        Post post = postRepository.findById(report.getTargetId())
                            .orElseThrow(() -> new IllegalArgumentException("Post not found with id: " + report.getTargetId()));
                        targetUserId = post.getOwner().getId();
                        System.out.println("=== [DEBUG] Post report - Post ID: " + report.getTargetId() + ", Owner ID: " + targetUserId + " ===");
                    } catch (Exception e) {
                        System.err.println("Error getting post owner: " + e.getMessage());
                        return; // Không thể lấy owner, bỏ qua auto-block
                    }
                } else {
                    targetUserId = null;
                }
                
                if (targetUserId != null) {
                    System.out.println("=== [DEBUG] Checking auto-block for user ID: " + targetUserId + " ===");
                    
                    // Đếm số báo cáo được duyệt cho target user (bao gồm cả báo cáo user và post)
                    long userReportsCount = reportRepository.countByTargetIdAndTargetTypeIdAndProcessingStatusIdAndStatus(
                        targetUserId, 4, 3, true
                    );
                    
                    // Đếm số báo cáo post được duyệt của user này
                    long postReportsCount = reportRepository.countApprovedPostReportsByUserId(targetUserId);
                    
                    long totalApprovedReports = userReportsCount + postReportsCount;
                    
                    System.out.println("[DEBUG] User reports count: " + userReportsCount);
                    System.out.println("[DEBUG] Post reports count: " + postReportsCount);
                    System.out.println("[DEBUG] Total approved reports count: " + totalApprovedReports);
                    
                    if (totalApprovedReports >= 3) {
                        System.out.println("[DEBUG] User has 3+ approved reports, proceeding with auto-block");
                        // Thực sự khóa tài khoản user
                        try {
                            User targetUser = userRepository.findById(targetUserId)
                                .orElseThrow(() -> new UserNotFoundException("Target user not found with id: " + targetUserId));
                            
                            // Chỉ khóa nếu user chưa bị khóa
                            if (targetUser.getStatus()) {
                                targetUser.setStatus(false);
                                userRepository.save(targetUser);
                                
                                System.out.println("=== AUTO-BLOCK USER ====");
                                System.out.println("User ID: " + targetUserId + " has been automatically blocked due to 3+ approved reports");
                            }
                        } catch (Exception e) {
                            System.err.println("Error blocking user: " + e.getMessage());
                            e.printStackTrace();
                        }
                        
                        // Gửi thông báo cho target user về việc bị block
                        String blockMessage = "Tài khoản của bạn đã bị khóa tự động do có 3 báo cáo được duyệt. Vui lòng liên hệ admin để được hỗ trợ.";
                        
                        notificationService.sendNotification(
                            targetUserId,
                            "AUTO_BLOCK_USER",
                            blockMessage,
                            admin.getId(),
                            "SYSTEM"
                        );
                        
                        messagingTemplate.convertAndSend(
                            "/topic/notifications/" + targetUserId,
                            Map.of(
                                "id", reportId,
                                "message", blockMessage,
                                "type", "AUTO_BLOCK_USER",
                                "targetId", admin.getId(),
                                "targetType", "SYSTEM",
                                "adminId", admin.getId(),
                                "adminDisplayName", "Hệ thống",
                                "createdAt", System.currentTimeMillis() / 1000,
                                "status", "unread"
                            )
                        );
                    }
                }
            }

            // Gửi thông báo WebSocket duy nhất
            messagingTemplate.convertAndSend(
                    "/topic/notifications/" + report.getReporter().getId(),
                    Map.of(
                            "id", reportId,
                            "message", message,
                            "type", "REPORT_STATUS_UPDATED",
                            "targetId", admin.getId(),
                            "targetType", "PROFILE",
                            "adminId", admin.getId(),
                            "adminDisplayName", admin.getDisplayName() != null ? admin.getDisplayName() : admin.getUsername(),
                            "createdAt", System.currentTimeMillis() / 1000,
                            "status", request.getProcessingStatusId() == 3 ? "read" : "unread"
                    )
            );

            // Lưu thông báo vào database
            notificationService.sendNotification(
                    report.getReporter().getId(),
                    "REPORT_STATUS_UPDATED",
                    message,
                    admin.getId(),
                    "PROFILE"
            );

            if (request.getProcessingStatusId() == 4) { // Rejected
                Instant startOfToday = LocalDate.now()
                        .atStartOfDay(ZoneId.systemDefault())
                        .toInstant();

                long rejectedCount = reportRepository.countByReporterIdAndProcessingStatusIdAndReportTime(
                        report.getReporter().getId(), 4, startOfToday
                );
                if (rejectedCount >= 3) {
                    String abuseMessage = "Bạn đã gửi quá nhiều báo cáo không hợp lệ hôm nay. Vui lòng kiểm tra lại hành vi báo cáo của bạn.";
                    notificationService.sendNotification(
                            report.getReporter().getId(),
                            "REPORT_ABUSE_WARNING",
                            abuseMessage,
                            admin.getId(),
                            "PROFILE"
                    );
                    messagingTemplate.convertAndSend(
                            "/topic/notifications/" + report.getReporter().getId(),
                            Map.of(
                                    "id", reportId,
                                    "message", abuseMessage,
                                    "type", "REPORT_ABUSE_WARNING",
                                    "targetId", admin.getId(),
                                    "targetType", "PROFILE",
                                    "createdAt", System.currentTimeMillis() / 1000,
                                    "status", "unread"
                            )
                    );
                }
            }
        } catch (Exception e) {
            e.printStackTrace(); // In chi tiết lỗi ra console
            String message = e.getCause() instanceof SQLException
                    ? e.getCause().getMessage()
                    : e.getMessage();

            throw new RuntimeException("❌ Lỗi khi cập nhật trạng thái báo cáo: " + message);
        }
    }

    @Transactional
    public void deleteReport(Integer reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found with id: " + reportId));
        ReportStatus status = reportStatusRepository.findById(4)
                .orElseThrow(() -> new IllegalArgumentException("Report status not found with id: 4"));

        try {
            ReportHistory history = new ReportHistory();
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User admin = userRepository.findByUsername(currentUsername)
                    .orElseThrow(() -> new UserNotFoundException("Admin not found"));
            history.setReporter(admin);
            history.setReport(report);
            history.setProcessingStatus(status);
            history.setActionTime(Instant.now());
            history.setStatus(true);
            reportHistoryRepository.save(history);

            String message = "Báo cáo của bạn (ID: " + reportId + ") đã bị xóa bởi " + admin.getDisplayName();
            messagingTemplate.convertAndSend(
                    "/topic/notifications/" + report.getReporter().getId(),
                    Map.of(
                            "id", reportId,
                            "message", message,
                            "type", "REPORT_DELETED",
                            "targetId", admin.getId(),
                            "targetType", "PROFILE", // Sửa: Gửi targetType dạng chuỗi
                            "adminId", admin.getId(),
                            "adminDisplayName", admin.getDisplayName() != null ? admin.getDisplayName() : admin.getUsername(),
                            "createdAt", System.currentTimeMillis() / 1000,
                            "status", "unread"
                    )
            );

            notificationService.sendNotification(
                    report.getReporter().getId(),
                    "REPORT_DELETED",
                    message,
                    admin.getId(),
                    "PROFILE"
            );

            report.setStatus(false);
            reportRepository.save(report);
            reportRepository.delete(report);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete report: " + e.getMessage());
        }
    }

    public ReportResponseDto getReportById(Integer reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found with id: " + reportId));
        return convertToReportResponseDto(report);
    }

    private ReportResponseDto convertToReportResponseDto(Report report) {
        ReportResponseDto dto = new ReportResponseDto();
        dto.setId(report.getId());
        dto.setReporterId(report.getReporter() != null ? report.getReporter().getId() : null);
        dto.setReporterUsername(report.getReporter() != null ? report.getReporter().getUsername() : null);
        dto.setTargetId(report.getTargetId());
        dto.setTargetTypeId(report.getTargetType() != null ? report.getTargetType().getId() : null);
        dto.setTargetTypeName(report.getTargetType() != null ? report.getTargetType().getName() : null);
        if (report.getReason() != null) {
            ReportReasonDto reasonDto = new ReportReasonDto();
            reasonDto.setId(report.getReason().getId());
            reasonDto.setName(report.getReason().getName());
            reasonDto.setDescription(report.getReason().getDescription());
            reasonDto.setStatus(report.getReason().getStatus());
            dto.setReason(reasonDto);
        }
        dto.setProcessingStatusId(report.getProcessingStatus() != null ? report.getProcessingStatus().getId() : null);
        dto.setProcessingStatusName(report.getProcessingStatus() != null ? report.getProcessingStatus().getName() : null);
        dto.setReportTime(report.getReportTime());
        dto.setStatus(report.getStatus());
        return dto;
    }


    public long countAllReports() {
        return reportRepository.count();
    }

}