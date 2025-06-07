package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.document.UserDocument;
import com.example.social_media.document.PostDocument;
import com.example.social_media.service.ElasticsearchSearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(URLConfig.SEARCH_BASE)
public class SearchController {

    private final ElasticsearchSearchService searchService;

    @Autowired
    public SearchController(ElasticsearchSearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDocument>> searchUsers(@RequestParam("keyword") String keyword) {
        List<UserDocument> users = searchService.searchUsers(keyword);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/posts")
    public ResponseEntity<List<PostDocument>> searchPosts(@RequestParam("keyword") String keyword) {
        List<PostDocument> posts = searchService.searchPosts(keyword);
        return ResponseEntity.ok(posts);
    }
}
