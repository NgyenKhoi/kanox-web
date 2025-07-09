package com.example.social_media.service;

import com.example.social_media.dto.report.CreateReportRequestDto;
import com.example.social_media.dto.report.ReportResponseDto;
import com.example.social_media.dto.report.UpdateReportStatusRequestDto;
import com.example.social_media.entity.Report;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.ReportRepository;
import com.example.social_media.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    public ReportService(ReportRepository reportRepository, UserRepository userRepository) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void createReport(CreateReportRequestDto request) {
        // Kiểm tra người dùng tồn tại
        userRepository.findById(request.getReporterId())
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + request.getReporterId()));

        // Gọi stored procedure để tạo báo cáo
        try {
            reportRepository.addReport(
                    request.getReporterId(),
                    request.getTargetId(),
                    request.getTargetTypeId(),
                    request.getReasonId(),
                    1, // processing_status_id mặc định là 1 (Pending)
                    true // status mặc định là true
            );
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
        // Kiểm tra admin tồn tại và có quyền
        User admin = userRepository.findById(request.getAdminId())
                .orElseThrow(() -> new UserNotFoundException("Admin not found with id: " + request.getAdminId()));
        if (!admin.getIsAdmin()) {
            throw new IllegalArgumentException("User is not an admin");
        }

        // Gọi stored procedure để cập nhật trạng thái báo cáo
        try {
            reportRepository.updateReportStatus(
                    reportId,
                    request.getAdminId(),
                    request.getProcessingStatusId()
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to update report status: " + e.getMessage());
        }
    }
}