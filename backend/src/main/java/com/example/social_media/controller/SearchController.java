
package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.document.*;
import com.example.social_media.service.DataSyncService;
import com.example.social_media.service.ElasticsearchSearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping(URLConfig.SEARCH_BASE)
public class SearchController {

    private final ElasticsearchSearchService searchService;
    private final DataSyncService dataSyncService;

    @Autowired
    public SearchController(ElasticsearchSearchService searchService, DataSyncService dataSyncService) {
        this.searchService = searchService;
        this.dataSyncService = dataSyncService;
    }

    @GetMapping(URLConfig.SEARCH_USER)
    public ResponseEntity<List<UserDocument>> searchUsers(@RequestParam("keyword") String keyword) {
        try {
            List<UserDocument> users = searchService.searchUsers(keyword);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    @GetMapping(URLConfig.SEARCH_GROUP)
    public ResponseEntity<List<GroupDocument>> searchGroups(@RequestParam("keyword") String keyword) {
        try {
            List<GroupDocument> groups = searchService.searchGroups(keyword);
            return ResponseEntity.ok(groups);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping(URLConfig.SEARCH_PAGE)
    public ResponseEntity<List<PageDocument>> searchPages(@RequestParam("keyword") String keyword) {
        try {
            List<PageDocument> pages = searchService.searchPages(keyword);
            return ResponseEntity.ok(pages);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    @PostMapping("/sync-users")
    public ResponseEntity<String> syncAllUsers() {
        dataSyncService.syncAllUsersToElasticsearch();
        return ResponseEntity.ok("Đã đồng bộ tất cả users vào Elasticsearch.");
    }
}