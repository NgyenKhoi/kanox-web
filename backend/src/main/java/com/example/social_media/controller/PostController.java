package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.post.PostRequestDto;
import com.example.social_media.dto.post.PostResponseDto;
import com.example.social_media.exception.BadRequestException;
import com.example.social_media.jwt.JwtService;
import com.example.social_media.service.PostService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(URLConfig.POST_BASE)
public class PostController {
    private static final Logger logger = LoggerFactory.getLogger(PostController.class);

    private final PostService postService;
    private final JwtService jwtService;

    public PostController(PostService postService, JwtService jwtService) {
        this.postService = postService;
        this.jwtService = jwtService;
    }

    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody @Valid PostRequestDto dto,
                                        @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String username = jwtService.extractUsername(token);
            PostResponseDto responseDto = postService.createPost(dto, username);
            return ResponseEntity.ok(responseDto);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(e.getMessage());
        }
    }

    @GetMapping(URLConfig.NEWSFEED)
    public ResponseEntity<?> getNewsfeed(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String username = jwtService.extractUsername(token);
            List<PostResponseDto> posts = postService.getAllPosts(username);
            return ResponseEntity.ok(posts);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(e.getMessage());
        }
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<?> getPostsByUsername(@PathVariable String username,
                                                @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String currentUsername = jwtService.extractUsername(token);
            List<PostResponseDto> posts = postService.getPostsByUsername(username, currentUsername);
            return ResponseEntity.ok(posts);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(e.getMessage());
        }
    }
}