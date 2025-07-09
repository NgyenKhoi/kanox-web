package com.example.social_media.service;

import com.example.social_media.dto.report.CreateReportRequestDto;
import com.example.social_media.dto.report.ReportResponseDto;
import com.example.social_media.dto.report.UpdateReportStatusRequestDto;
import com.example.social_media.entity.*;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ReportReasonRepository reportReasonRepository;
    private final ReportStatusRepository reportStatusRepository;
    private final ReportHistoryRepository reportHistoryRepository;
    private final ReportLimitRepository reportLimitRepository; // Thêm repository
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private static final int MAX_REPORTS_PER_DAY = 5; // Giới hạn báo cáo mỗi ngày

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

        // Kiểm tra giới hạn báo cáo
        ReportLimit limit = reportLimitRepository.findById(request.getReporterId())
                .orElse(new ReportLimit());
        if (limit.getLastReportReset() == null || limit.getLastReportReset().isBefore(Instant.now().minus(1, ChronoUnit.DAYS))) {
            limit.setReportCount(0);
            limit.setLastReportReset(Instant.now());
        }
        if (limit.getReportCount() >= MAX_REPORTS_PER_DAY) {
            throw new IllegalStateException("Đã vượt quá giới hạn báo cáo trong ngày!");
        }

        ReportReason reason = reportReasonRepository.findById(request.getReasonId())
                .orElseThrow(() -> new IllegalArgumentException("Report reason not found with id: " + request.getReasonId()));

        try {
            // Gọi stored procedure để tạo báo cáo và lấy reportId
            Integer reportId = reportRepository.addReport(
                    request.getReporterId(),
                    request.getTargetId(),
                    request.getTargetTypeId(),
                    request.getReasonId(),
                    1, // processing_status_id mặc định là 1 (Pending)
                    true, // status mặc định là true
                    null // report_id là OUTPUT parameter
            );

            // Lấy đối tượng Report vừa tạo
            Report report = reportRepository.findById(reportId)
                    .orElseThrow(() -> new IllegalArgumentException("Report not found with id: " + reportId));

            // Cập nhật giới hạn báo cáo
            limit.setReportCount(limit.getReportCount() + 1);
            limit.setUser(reporter);
            limit.setStatus(true);
            reportLimitRepository.save(limit);

            // Gửi thông báo WebSocket cho admin
            messagingTemplate.convertAndSend("/topic/admin/reports", Map.of(
                    "id", reportId,
                    "targetId", request.getTargetId(),
                    "reportType", request.getTargetTypeId() == 1 ? "POST" : request.getTargetTypeId() == 2 ? "USER" : "UNKNOWN",
                    "reporterUsername", reporter.getUsername(),
                    "reason", reason.getName(),
                    "createdAt", System.currentTimeMillis() / 1000
            ));

            // Lưu lịch sử báo cáo
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
            throw new RuntimeException("Failed to create report: " + e.getMessage());
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
    public Page<Report> getReportsPaged(Boolean status, Pageable pageable) {
        return reportRepository.findByStatus(status, pageable);
    }

    @Transactional
    public void updateReportStatus(Integer reportId, UpdateReportStatusRequestDto request) {
        User admin = userRepository.findById(request.getAdminId())
                .orElseThrow(() -> new UserNotFoundException("Admin not found with id: " + request.getAdminId()));
        if (!admin.getIsAdmin()) {
            throw new IllegalArgumentException("User is not an admin");
        }

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found with id: " + reportId));
        ReportStatus status = reportStatusRepository.findById(request.getProcessingStatusId())
                .orElseThrow(() -> new IllegalArgumentException("Report status not found with id: " + request.getProcessingStatusId()));

        try {
            reportRepository.updateReportStatus(
                    reportId,
                    request.getAdminId(),
                    request.getProcessingStatusId()
            );

            // Lưu lịch sử báo cáo
            ReportHistory history = new ReportHistory();
            history.setReporter(admin);
            history.setReport(report);
            history.setProcessingStatus(status);
            history.setActionTime(Instant.now());
            history.setStatus(true);
            reportHistoryRepository.save(history);

            // Gửi thông báo đến user đã báo cáo
            String message = status.getId() == 2
                    ? "Báo cáo của bạn đã được duyệt."
                    : "Báo cáo của bạn đã bị từ chối.";
            notificationService.sendReportNotification(
                    report.getReporter().getId(), // userId
                    "REPORT_STATUS_UPDATED", // notificationTypeName
                    message, // message
                    report.getTargetId(), // targetId
                    report.getTargetType().getId() // targetTypeId
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to update report status: " + e.getMessage());
        }
    }

    public Report getReportById(Integer reportId) {
        return reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found with id: " + reportId));
    }
    @Transactional
    public void deleteReport(Integer reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found with id: " + reportId));
        ReportStatus status = reportStatusRepository.findById(3)
                .orElseThrow(() -> new IllegalArgumentException("Report status not found with id: 3"));

        try {
            // Lưu lịch sử trước khi xóa
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

            reportRepository.delete(report);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete report: " + e.getMessage());
        }
    }
}