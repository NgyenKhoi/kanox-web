
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping(URLConfig.SEARCH_BASE)
public class SearchController {

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

    @PostMapping(URLConfig.SEARCH_SYNC)
    public ResponseEntity<String> syncAllData() {
        dataSyncService.syncAllToElasticsearch();
        return ResponseEntity.ok("Đã đồng bộ tất cả users, groups, pages vào Elasticsearch.");
    }

    @GetMapping(URLConfig.SEARCH_ALL)
    public ResponseEntity<SearchResponseDto> searchAll(@RequestParam("keyword") String keyword) {
        try {
            List<UserDto> userDtos = searchService.searchUsers(keyword)
                    .stream()
                    .map(documentMapper::toUserDto)
                    .collect(Collectors.toList());

            List<GroupDto> groupDtos = searchService.searchGroups(keyword)
                    .stream()
                    .map(documentMapper::toGroupDto)
                    .collect(Collectors.toList());

            List<PageDto> pageDtos = searchService.searchPages(keyword)
                    .stream()
                    .map(documentMapper::toPageDto)
                    .collect(Collectors.toList());

            SearchResponseDto result = new SearchResponseDto(userDtos, groupDtos, pageDtos);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new SearchResponseDto(
                    Collections.emptyList(),
                    Collections.emptyList(),
                    Collections.emptyList()
            ));
        }
    }
}