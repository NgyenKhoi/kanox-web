package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.report.CreateReportRequestDto;
import com.example.social_media.entity.ReportReason;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.ReportReasonRepository;
import com.example.social_media.service.CustomUserDetailsService;
import com.example.social_media.service.ReportService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(URLConfig.REPORT_BASE)
public class ReportController {

    private final ReportService reportService;
    private final CustomUserDetailsService customUserDetailsService;
    private final ReportReasonRepository reportReasonRepository;

    public ReportController(ReportService reportService, CustomUserDetailsService customUserDetailsService, ReportReasonRepository reportReasonRepository) {
        this.reportService = reportService;
        this.customUserDetailsService = customUserDetailsService;
        this.reportReasonRepository = reportReasonRepository;
    }

    @PostMapping(URLConfig.CREATE_REPORT)
    public ResponseEntity<?> createReport(@RequestBody CreateReportRequestDto request) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = customUserDetailsService.getUserByUsername(currentUsername);
            request.setReporterId(currentUser.getId());
            reportService.createReport(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Report created successfully"));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found", "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Failed to create report", "error", e.getMessage()));
        }
    }

    @GetMapping(URLConfig.REPORT_REASON)
    public ResponseEntity<List<ReportReason>> getReportReasons() {
        try {
            List<ReportReason> reasons = reportReasonRepository.findAll();
            return ResponseEntity.ok(reasons);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }
}