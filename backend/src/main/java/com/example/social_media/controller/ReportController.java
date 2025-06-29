package com.example.social_media.controller;

import com.example.social_media.entity.Report;
import com.example.social_media.dto.report.ReportDto;
import com.example.social_media.service.ReportService;
import com.example.social_media.service.CustomUserDetailsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/reports")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class ReportController {
    private static final Logger logger = LoggerFactory.getLogger(ReportController.class);

    private final ReportService reportService;
    private final CustomUserDetailsService customUserDetailsService;

    @Autowired
    public ReportController(ReportService reportService, CustomUserDetailsService customUserDetailsService) {
        this.reportService = reportService;
        this.customUserDetailsService = customUserDetailsService;
    }

    /**
     * Lấy tất cả báo cáo với phân trang
     */
    @GetMapping
    public ResponseEntity<?> getAllReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "reportTime") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        try {
            logger.info("Getting report list with page={}, size={}", page, size);
            
            Sort sort = Sort.by(sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC, sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<Report> reportsPage = reportService.getAllReports(pageable);
            
            // Chuyển đổi từ entity sang DTO
            Page<ReportDto> reportDtos = reportsPage.map(ReportDto::fromEntity);
            
            Map<String, Object> response = new HashMap<>();
            response.put("reports", reportDtos.getContent());
            response.put("currentPage", reportDtos.getNumber());
            response.put("totalItems", reportDtos.getTotalElements());
            response.put("totalPages", reportDtos.getTotalPages());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error when getting report list: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "Error when getting report list: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Lấy báo cáo theo loại nội dung
     */
    @GetMapping(params = "type")
    public ResponseEntity<?> getReportsByType(
            @RequestParam String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "reportTime") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        try {
            logger.info("Getting report list by type: {} with page={}, size={}", type, page, size);
            
            Sort sort = Sort.by(sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC, sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<Report> reportsPage = reportService.getReportsByType(type, pageable);
            
            // Chuyển đổi từ entity sang DTO
            Page<ReportDto> reportDtos = reportsPage.map(ReportDto::fromEntity);
            
            Map<String, Object> response = new HashMap<>();
            response.put("reports", reportDtos.getContent());
            response.put("currentPage", reportDtos.getNumber());
            response.put("totalItems", reportDtos.getTotalElements());
            response.put("totalPages", reportDtos.getTotalPages());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error when getting report list by type: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "Error when getting report list by type: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Lấy chi tiết báo cáo
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getReportById(@PathVariable Integer id) {
        try {
            logger.info("Getting report details with ID: {}", id);
            Report report = reportService.getReportById(id);
            ReportDto reportDto = ReportDto.fromEntity(report);
            return ResponseEntity.ok(reportDto);
        } catch (IllegalArgumentException e) {
            logger.error("Report not found: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("Error getting report details: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "Error getting report details: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Xử lý báo cáo (đánh dấu đã xử lý)
     */
    @PatchMapping("/{id}/resolve")
    public ResponseEntity<?> resolveReport(@PathVariable Integer id) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            logger.info("Resolving report with ID: {} by user: {}", id, currentUsername);
            
            Report report = reportService.resolveReport(id, currentUsername);
            ReportDto reportDto = ReportDto.fromEntity(report);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Report resolved successfully");
            response.put("report", reportDto);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Report not found: {}", e.getMessage());
            return ResponseEntity.status(404).body("Report not found or no permission to resolve");
        } catch (Exception e) {
            logger.error("Error when resolving report: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
              errorResponse.put("message", "Error when resolving report: " + e.getMessage());
              return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Gỡ nội dung bị báo cáo
     */
    @PatchMapping("/content/{type}/{id}/remove")
    public ResponseEntity<?> removeReportedContent(
            @PathVariable String type,
            @PathVariable Integer id
    ) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            logger.info("Removing reported content with ID: {} by user: {}", id, currentUsername);
            
            reportService.removeReportedContent(id, type, currentUsername);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Reported content removed successfully");
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Error when removing content: {}", e.getMessage());
            return ResponseEntity.status(404).body("Report not found or no permission to remove content");
        } catch (Exception e) {
            logger.error("Error when removing content: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
              errorResponse.put("message", "Error when removing content: " + e.getMessage());
              return ResponseEntity.status(500).body(errorResponse);
        }
    }
}