package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.document.*;
import com.example.social_media.dto.search.SearchResponseDto;
import com.example.social_media.dto.user.GroupDto;
import com.example.social_media.dto.user.PageDto;
import com.example.social_media.dto.user.UserDto;
import com.example.social_media.mapper.DocumentMapper;
import com.example.social_media.service.DataSyncService;
import com.example.social_media.service.ElasticsearchSearchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping(URLConfig.SEARCH_BASE)
public class SearchController {

    private static final Logger logger = LoggerFactory.getLogger(SearchController.class);

    private final ElasticsearchSearchService searchService;
    private final DataSyncService dataSyncService;
    private final DocumentMapper documentMapper;

    @Autowired
    public SearchController(ElasticsearchSearchService searchService, DataSyncService dataSyncService, DocumentMapper documentMapper) {
        this.searchService = searchService;
        this.dataSyncService = dataSyncService;
        this.documentMapper = documentMapper;
    }

    @GetMapping(URLConfig.SEARCH_USER)
    public ResponseEntity<List<UserDto>> searchUsers(@RequestParam("keyword") String keyword) {
        try {
            List<UserDocument> users = searchService.searchUsers(keyword);
            List<UserDto> userDtos = users != null ? users.stream()
                    .map(documentMapper::toUserDto)
                    .collect(Collectors.toList()) : Collections.emptyList();
            return ResponseEntity.ok(userDtos);
        } catch (Exception e) {
            logger.error("Error searching users with keyword '{}': {}", keyword, e.getMessage(), e);
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    @GetMapping(URLConfig.SEARCH_GROUP)
    public ResponseEntity<List<GroupDto>> searchGroups(@RequestParam("keyword") String keyword) {
        try {
            List<GroupDocument> groups = searchService.searchGroups(keyword);
            List<GroupDto> groupDtos = groups != null ? groups.stream()
                    .map(documentMapper::toGroupDto)
                    .collect(Collectors.toList()) : Collections.emptyList();
            return ResponseEntity.ok(groupDtos);
        } catch (Exception e) {
            logger.error("Error searching groups with keyword '{}': {}", keyword, e.getMessage(), e);
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    @GetMapping(URLConfig.SEARCH_PAGE)
    public ResponseEntity<List<PageDto>> searchPages(@RequestParam("keyword") String keyword) {
        try {
            List<PageDocument> pages = searchService.searchPages(keyword);
            List<PageDto> pageDtos = pages != null ? pages.stream()
                    .map(documentMapper::toPageDto)
                    .collect(Collectors.toList()) : Collections.emptyList();
            return ResponseEntity.ok(pageDtos);
        } catch (Exception e) {
            logger.error("Error searching pages with keyword '{}': {}", keyword, e.getMessage(), e);
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    @PostMapping(URLConfig.SEARCH_SYNC)
    public ResponseEntity<String> syncAllData() {
        try {
            dataSyncService.syncAllToElasticsearch();
            logger.info("Successfully synced all data to Elasticsearch.");
            return ResponseEntity.ok("Đã đồng bộ tất cả users, groups, pages vào Elasticsearch.");
        } catch (Exception e) {
            logger.error("Error syncing data to Elasticsearch: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Lỗi khi đồng bộ dữ liệu vào Elasticsearch: " + e.getMessage());
        }
    }

    @GetMapping(URLConfig.SEARCH_ALL)
    public ResponseEntity<SearchResponseDto> searchAll(@RequestParam("keyword") String keyword) {
        try {
            List<UserDto> userDtos = searchService.searchUsers(keyword).stream()
                    .map(documentMapper::toUserDto)
                    .collect(Collectors.toList());

            List<GroupDto> groupDtos = searchService.searchGroups(keyword).stream()
                    .map(documentMapper::toGroupDto)
                    .collect(Collectors.toList());

            List<PageDto> pageDtos = searchService.searchPages(keyword).stream()
                    .map(documentMapper::toPageDto)
                    .collect(Collectors.toList());

            SearchResponseDto result = new SearchResponseDto(userDtos, groupDtos, pageDtos);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error searching all with keyword '{}': {}", keyword, e.getMessage(), e);
            return ResponseEntity.status(500).body(new SearchResponseDto(
                    Collections.emptyList(),
                    Collections.emptyList(),
                    Collections.emptyList()
            ));
        }
    }
}