package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.user.UserRegistrationStatsDTO;
import com.example.social_media.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(URLConfig.DASHBOARD_BASE)
public class DashboardController {
    private final UserService userService;
    private final GroupService groupService;
    private final PostService postService;
    private final ReportService reportService;
    private final UserRegistrationService userRegistrationService;

    @Autowired
    public DashboardController(
            UserService userService,
            GroupService groupService,
            PostService postService,
            ReportService reportService,
            UserRegistrationService userRegistrationService
    ) {
        this.userService = userService;
        this.groupService = groupService;
        this.postService = postService;
        this.reportService = reportService;
        this.userRegistrationService = userRegistrationService;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getDashboardStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalUsers", userService.countAllUsers());
        stats.put("totalGroups", groupService.countAllGroups());
        stats.put("totalPosts", postService.countAllPosts());
        stats.put("totalReports", reportService.countAllReports());
        return ResponseEntity.ok(stats);
    }

    @GetMapping(URLConfig.REGISTRATIONS_BY_WEEK)
    public ResponseEntity<?> getUserRegistrationsByWeek(
            @RequestParam(required = false) Integer startYear,
            @RequestParam(required = false) Integer endYear) {
        try {
            List<UserRegistrationStatsDTO> stats = userRegistrationService.getUserRegistrationsByWeek(startYear, endYear);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving registration stats", "error", e.getMessage()));
        }
    }
}
