package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.report.CreateReportRequestDto;
import com.example.social_media.dto.report.ReportReasonDto;
import com.example.social_media.entity.ReportReason;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.report.ReportReasonRepository;
import com.example.social_media.service.CustomUserDetailsService;
import com.example.social_media.service.ReportService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping(URLConfig.REPORT_BASE)
public class ReportController {

    private final ReportService reportService;
    private final CustomUserDetailsService customUserDetailsService;
    private final ReportReasonRepository reportReasonRepository;

    public ReportController(
            ReportService reportService,
            CustomUserDetailsService customUserDetailsService,
            ReportReasonRepository reportReasonRepository
    ) {
        this.reportService = reportService;
        this.customUserDetailsService = customUserDetailsService;
        this.reportReasonRepository = reportReasonRepository;
    }

    @PostMapping(URLConfig.CREATE_REPORT)
    public ResponseEntity<?> createReport(@RequestBody CreateReportRequestDto request) {
        try {
            System.out.println("Creating report with request: reporterId=" + request.getReporterId()
                    + ", targetId=" + request.getTargetId()
                    + ", targetTypeId=" + request.getTargetTypeId()
                    + ", reasonId=" + request.getReasonId());
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            request.setReporterId(currentUser.getId());
            reportService.createReport(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Báo cáo đã được gửi thành công"));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "error", "message", "Không tìm thấy người dùng", "errors", Map.of()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("status", "error", "message", e.getMessage(), "errors", Map.of()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", "Lỗi khi gửi báo cáo: " + e.getMessage(), "errors", Map.of()));
        }
    }

    @GetMapping(URLConfig.REPORT_REASON)
    public ResponseEntity<?> getReportReasons() {
        try {
            List<ReportReason> reasons = reportReasonRepository.findAll();
            List<ReportReasonDto> reasonDtos = reasons.stream()
                    .map(this::convertToReportReasonDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(reasonDtos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to retrieve report reasons", "error", e.getMessage()));
        }
    }

    private ReportReasonDto convertToReportReasonDto(ReportReason reason) {
        ReportReasonDto dto = new ReportReasonDto();
        dto.setId(reason.getId());
        dto.setName(reason.getName());
        dto.setDescription(reason.getDescription());
        dto.setStatus(reason.getStatus());
        return dto;
    }
}