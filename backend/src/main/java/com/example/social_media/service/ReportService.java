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
            Integer reportId = reportRepository.addReport(
                    request.getReporterId(),
                    request.getTargetId(),
                    request.getTargetTypeId(),
                    request.getReasonId()
            );

            Report report = reportRepository.findById(reportId)
                    .orElseThrow(() -> new IllegalArgumentException("Report not found with id: " + reportId));

            limit.setReportCount(limit.getReportCount() + 1);
            limit.setUser(reporter);
            limit.setStatus(true);
            reportLimitRepository.save(limit);

            messagingTemplate.convertAndSend("/topic/admin/reports", Map.of(
                    "id", reportId,
                    "targetId", request.getTargetId(),
                    "reportType", request.getTargetTypeId() == 1 ? "POST" : request.getTargetTypeId() == 2 ? "USER" : "UNKNOWN",
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

    @Transactional(readOnly = true)
    public Page<Report> getReportsByProcessingStatusId(Integer processingStatusId, Pageable pageable) {
        return reportRepository.findByProcessingStatusId(processingStatusId, pageable);
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

            ReportHistory history = new ReportHistory();
            history.setReporter(admin);
            history.setReport(report);
            history.setProcessingStatus(status);
            history.setActionTime(Instant.now());
            history.setStatus(true);
            reportHistoryRepository.save(history);

            String message;
            switch (request.getProcessingStatusId()) {
                case 1:
                    message = "Báo cáo của bạn đang chờ xử lý.";
                    break;
                case 2:
                    message = "Báo cáo của bạn đang được xem xét.";
                    break;
                case 3:
                    message = "Báo cáo của bạn đã được duyệt.";
                    break;
                case 4:
                    message = "Báo cáo của bạn đã bị từ chối.";
                    break;
                default:
                    message = "Trạng thái báo cáo đã được cập nhật.";
            }
            notificationService.sendReportNotification(
                    report.getReporter().getId(),
                    "REPORT_STATUS_UPDATED",
                    message,
                    report.getTargetId(),
                    report.getTargetType().getId()
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

            report.setStatus(false);
            reportRepository.save(report);
            reportRepository.delete(report);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete report: " + e.getMessage());
        }
    }
}