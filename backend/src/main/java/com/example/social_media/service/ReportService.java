package com.example.social_media.service;

import com.example.social_media.dto.report.CreateReportRequestDto;
import com.example.social_media.dto.report.ReportResponseDto;
import com.example.social_media.dto.report.UpdateReportStatusRequestDto;
import com.example.social_media.dto.report.ReportReasonDto;
import com.example.social_media.entity.*;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.*;
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
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private static final int MAX_REPORTS_PER_DAY = 5;

    public ReportService(
            ReportRepository reportRepository,
            UserRepository userRepository,
            ReportReasonRepository reportReasonRepository,
            ReportStatusRepository reportStatusRepository,
            ReportHistoryRepository reportHistoryRepository,
            ReportLimitRepository reportLimitRepository,
            SimpMessagingTemplate messagingTemplate,
            NotificationService notificationService
    ) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.reportReasonRepository = reportReasonRepository;
        this.reportStatusRepository = reportStatusRepository;
        this.reportHistoryRepository = reportHistoryRepository;
        this.reportLimitRepository = reportLimitRepository;
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
                    "createdAt", System.currentTimeMillis() / 1000
            ));

            ReportStatus status = reportStatusRepository.findById(1)
                    .orElseThrow(() -> new IllegalArgumentException("Report status not found with id: 1"));
            ReportHistory history = new ReportHistory();
            history.setReporter(reporter);
            history.setReport(report);
            history.setProcessingStatus(status);
            history.setActionTime(Instant.now());
            history.setStatus(true);
            reportHistoryRepository.save(history);
        } catch (Exception e) {
            String errorMessage = e.getCause() instanceof SQLException ? e.getCause().getMessage() : "Failed to create report";
            if (errorMessage.contains("Bạn đã báo cáo nội dung này trước đó.")) {
                throw new IllegalArgumentException("Bạn đã báo cáo nội dung này trước đó. Vui lòng chờ xử lý.");
            }
            throw new RuntimeException("Failed to create report: " + errorMessage);
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
        System.out.println("Current username: " + currentUsername);
        if (currentUsername == null) {
            throw new IllegalStateException("No authenticated user found");
        }
        User admin = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new UserNotFoundException("Admin not found with username: " + currentUsername));
        System.out.println("Admin ID: " + admin.getId());
        if (!admin.getIsAdmin()) {
            throw new IllegalArgumentException("User is not an admin");
        }

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found with id: " + reportId));
        ReportStatus status = reportStatusRepository.findById(request.getProcessingStatusId())
                .orElseThrow(() -> new IllegalArgumentException("Report status not found with id: " + request.getProcessingStatusId()));

        try {
            // Cập nhật trạng thái báo cáo
            reportRepository.updateReportStatus(reportId, admin.getId(), request.getProcessingStatusId());

            // Xây dựng thông báo
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

            // Gửi thông báo qua WebSocket
            messagingTemplate.convertAndSend(
                    "/topic/notifications/" + report.getReporter().getId(),
                    Map.of(
                            "id", reportId,
                            "message", message,
                            "type", "REPORT_STATUS_UPDATED",
                            "targetId", admin.getId(), // Sửa: Sử dụng admin.getId() thay vì report.getTargetId()
                            "targetTypeId", report.getTargetType().getId(),
                            "adminId", admin.getId(),
                            "adminDisplayName", admin.getDisplayName() != null ? admin.getDisplayName() : admin.getUsername(),
                            "createdAt", System.currentTimeMillis() / 1000,
                            "status", request.getProcessingStatusId() == 3 ? "read" : "unread"
                    )
            );

            // Lưu thông báo vào bảng tblNotification
            notificationService.sendNotification(
                    report.getReporter().getId(),
                    "REPORT_STATUS_UPDATED",
                    message,
                    admin.getId(), // Sửa: Sử dụng admin.getId() thay vì report.getTargetId()
                    "PROFILE" // Sửa: Đặt targetType là PROFILE vì targetId là admin
            );

            // Kiểm tra lạm dụng báo cáo (nếu cần)
            if (request.getProcessingStatusId() == 4) { // Rejected
                long rejectedCount = reportRepository.countByReporterIdAndProcessingStatusIdAndReportTime(
                        report.getReporter().getId(),
                        4,
                        LocalDate.now()
                );
                if (rejectedCount >= 5) {
                    String abuseMessage = "Bạn đã gửi quá nhiều báo cáo không hợp lệ hôm nay. Vui lòng kiểm tra lại hành vi báo cáo của bạn.";
                    notificationService.sendNotification(
                            report.getReporter().getId(),
                            "REPORT_ABUSE_WARNING",
                            abuseMessage,
                            admin.getId(), // Sửa: Sử dụng admin.getId()
                            "PROFILE"
                    );
                    messagingTemplate.convertAndSend(
                            "/topic/notifications/" + report.getReporter().getId(),
                            Map.of(
                                    "id", reportId,
                                    "message", abuseMessage,
                                    "type", "REPORT_ABUSE_WARNING",
                                    "targetId", admin.getId(), // Sửa: Sử dụng admin.getId()
                                    "targetTypeId", report.getTargetType().getId(),
                                    "createdAt", System.currentTimeMillis() / 1000,
                                    "status", "unread"
                            )
                    );
                }
            }

        } catch (DataAccessException e) {
            String errorMessage = e.getCause() instanceof SQLException ? e.getCause().getMessage() : "Failed to update report status";
            throw new RuntimeException("Failed to update report status: " + errorMessage);
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

            // Gửi thông báo qua WebSocket
            String message = "Báo cáo của bạn (ID: " + reportId + ") đã bị xóa bởi " + admin.getDisplayName();
            messagingTemplate.convertAndSend(
                    "/topic/notifications/" + report.getReporter().getId(),
                    Map.of(
                            "id", reportId,
                            "message", message,
                            "type", "REPORT_DELETED",
                            "targetId", report.getTargetId(),
                            "targetTypeId", report.getTargetType().getId(),
                            "adminId", admin.getId(),
                            "adminDisplayName", admin.getDisplayName() != null ? admin.getDisplayName() : admin.getUsername(),
                            "createdAt", System.currentTimeMillis() / 1000,
                            "status", "unread"
                    )
            );

            // Lưu thông báo vào database
            notificationService.sendNotification(
                    report.getReporter().getId(),
                    "REPORT_DELETED",
                    message,
                    report.getTargetId(),
                    report.getTargetType().getCode()
            );

            report.setStatus(false);
            reportRepository.save(report);
            reportRepository.delete(report);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete report: " + e.getMessage());
        }
    }
    public long countAllReports() {
        return reportRepository.count();
    }

}