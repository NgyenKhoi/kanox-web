package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.post.PostRequestDto;
import com.example.social_media.dto.post.PostResponseDto;
import com.example.social_media.exception.UnauthorizedException;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.jwt.JwtService;
import com.example.social_media.service.PostService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    @PostMapping(consumes = { "multipart/form-data" })
    public ResponseEntity<Map<String, Object>> createPost(
            @RequestPart("post") @Valid PostRequestDto dto,
            @RequestPart(value = "media", required = false) List<MultipartFile> mediaFiles,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String username = jwtService.extractUsername(token);
            logger.debug("Creating post for user: {}", username);
            PostResponseDto responseDto = postService.createPost(dto, username, mediaFiles);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Tạo bài post thành công");
            response.put("data", responseDto);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Error creating post: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Lỗi hệ thống: " + e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/{postId}")
    public ResponseEntity<Map<String, Object>> updatePost(@PathVariable Integer postId,
            @RequestBody @Valid PostRequestDto dto,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String username = jwtService.extractUsername(token);
            logger.debug("Updating post {} for user: {}", postId, username);
            PostResponseDto responseDto = postService.updatePost(postId, dto, username);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Cập nhật bài post thành công");
            response.put("data", responseDto);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Error updating post: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (UserNotFoundException e) {
            logger.error("Post not found: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (UnauthorizedException e) {
            logger.error("Unauthorized access: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Lỗi hệ thống: " + e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Map<String, Object>> deletePost(@PathVariable Integer postId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String username = jwtService.extractUsername(token);
            logger.debug("Deleting post {} for user: {}", postId, username);
            postService.deletePost(postId, username);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Xóa bài post thành công");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Error deleting post: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (UserNotFoundException e) {
            logger.error("Post not found: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (UnauthorizedException e) {
            logger.error("Unauthorized access: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Lỗi hệ thống: " + e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping(URLConfig.NEWSFEED)
    public ResponseEntity<Map<String, Object>> getNewsfeed(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String username = jwtService.extractUsername(token);
            logger.debug("Fetching newsfeed for user: {}", username);
            List<PostResponseDto> posts = postService.getAllPosts(username);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Lấy newsfeed thành công");
            response.put("data", posts);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Error fetching newsfeed: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Lỗi hệ thống: " + e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping(URLConfig.USER_POST)
    public ResponseEntity<Map<String, Object>> getPostsByUsername(@PathVariable String username,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String currentUsername = jwtService.extractUsername(token);
            logger.debug("Fetching posts for user: {} by viewer: {}", username, currentUsername);
            List<PostResponseDto> posts = postService.getPostsByUsername(username, currentUsername);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Lấy bài post của người dùng thành công");
            response.put("data", posts);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Error fetching user posts: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Lỗi hệ thống: " + e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}