package com.example.social_media.controller;

import com.example.social_media.service.UserService;
import com.example.social_media.service.GroupService;
import com.example.social_media.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
public class DashboardController {
    private final UserService userService;
    private final GroupService groupService;
    private final PostService postService;

    @Autowired
    public DashboardController(UserService userService, GroupService groupService, PostService postService) {
        this.userService = userService;
        this.groupService = groupService;
        this.postService = postService;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getDashboardStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalUsers", userService.countAllUsers());
        stats.put("totalGroups", groupService.countAllGroups());
        stats.put("totalPosts", postService.countAllPosts());
        return ResponseEntity.ok(stats);
    }
} 