package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.service.UserService;
import com.example.social_media.service.GroupService;
import com.example.social_media.service.PostService;
import com.example.social_media.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping(URLConfig.ADMIN_BASE + "/dashboard")
public class DashboardController {
    private final UserService userService;
    private final GroupService groupService;
    private final PostService postService;
    private final ReportService reportService;

    @Autowired
    public DashboardController(UserService userService, GroupService groupService, PostService postService, ReportService reportService) {
        this.userService = userService;
        this.groupService = groupService;
        this.postService = postService;
        this.reportService = reportService;
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
}
