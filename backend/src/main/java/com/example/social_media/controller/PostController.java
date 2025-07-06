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

import java.time.Instant;
import java.time.format.DateTimeParseException;
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

    @PostMapping(consumes = { "multipart/form-data", "application/json" })
    public ResponseEntity<Map<String, Object>> createPost(
            @RequestPart(value = "post", required = false) @Valid PostRequestDto dto,
            @RequestBody(required = false) @Valid PostRequestDto jsonDto,
            @RequestPart(value = "media", required = false) List<MultipartFile> mediaFiles,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String username = jwtService.extractUsername(token);
            logger.debug("Tạo bài post cho người dùng: {}", username);

            // Chọn DTO từ multipart hoặc JSON
            PostRequestDto finalDto = dto != null ? dto : jsonDto;
            if (finalDto == null) {
                throw new IllegalArgumentException("Dữ liệu bài post không được cung cấp");
            }

            PostResponseDto responseDto = postService.createPost(finalDto, username, mediaFiles);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Tạo bài post thành công");
            response.put("data", responseDto);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Lỗi khi tạo bài post: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            logger.error("Lỗi hệ thống: {}", e.getMessage(), e);
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

    @PostMapping(URLConfig.SAVE_POST)
    public ResponseEntity<Map<String, Object>> savePost(
            @PathVariable Integer postId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String username = jwtService.extractUsername(token);
            logger.debug("Saving post {} for user: {}", postId, username);
            postService.savePost(postId, username);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Lưu bài viết thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error saving post: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Lỗi khi lưu bài viết: " + e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping(URLConfig.HIDE_POST)
    public ResponseEntity<Map<String, Object>> hidePost(
            @PathVariable Integer postId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String username = jwtService.extractUsername(token);
            logger.debug("Hiding post {} for user: {}", postId, username);
            postService.hidePost(postId, username);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Ẩn bài viết thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error hiding post: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Lỗi khi ẩn bài viết: " + e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping(URLConfig.UNSAVE_POST)
    public ResponseEntity<Map<String, Object>> unsavePost(
            @PathVariable Integer postId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String username = jwtService.extractUsername(token);
            logger.debug("Un-saving post {} for user: {}", postId, username);
            postService.unsavePost(postId, username);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Bỏ lưu bài viết thành công");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Error unsaving post: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error during unsave: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Lỗi khi bỏ lưu bài viết: " + e.getMessage());
            errorResponse.put("errors", new HashMap<>());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping(URLConfig.GET_SAVE_POST)
    public ResponseEntity<Map<String, Object>> getSavedPosts(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        try {
            String token = authHeader.substring(7);
            String username = jwtService.extractUsername(token);
            logger.debug("Fetching saved posts for user: {}", username);

            // Parse ISO 8601 date string to Instant
            Instant fromInstant = (from != null && !from.isBlank()) ? Instant.parse(from) : null;
            Instant toInstant = (to != null && !to.isBlank()) ? Instant.parse(to) : null;

            List<PostResponseDto> posts = postService.getSavedPostsForUser(username, fromInstant, toInstant);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Lấy bài viết đã lưu thành công");
            response.put("data", posts);
            return ResponseEntity.ok(response);
        } catch (DateTimeParseException e) {
            logger.error("Invalid date format: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Sai định dạng ngày: " + e.getParsedString());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            logger.error("Error fetching saved posts: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/community-feed")
    public ResponseEntity<Map<String, Object>> getCommunityFeed(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String username = jwtService.extractUsername(token);
            logger.debug("Fetching community feed for user: {}", username);
            List<PostResponseDto> posts = postService.getCommunityFeed(username);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Lấy bảng tin cộng đồng thành công");
            response.put("data", posts);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Error fetching community feed: {}", e.getMessage());
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