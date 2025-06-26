package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.comment.CommentRequestDto;
import com.example.social_media.dto.comment.CommentResponseDto;
import com.example.social_media.exception.UnauthorizedException;
import com.example.social_media.service.CommentService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(URLConfig.COMMENT_BASE)
public class CommentController {
    
    private static final Logger logger = LoggerFactory.getLogger(CommentController.class);
    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping
    public ResponseEntity<?> createComment(@RequestBody @Valid CommentRequestDto request) {
        try {
            // Gọi service để tạo bình luận
            CommentResponseDto responseDto = commentService.createComment(
                    request.getUserId(),
                    request.getPostId(),
                    request.getContent(),
                    request.getPrivacySetting(),
                    request.getParentCommentId(),
                    request.getCustomListId()
            );

            // Chuẩn bị phản hồi
            Map<String, Object> response = new HashMap<>();
            response.put("message", responseDto.getMessage());
            response.put("data", responseDto);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Lỗi khi tạo bình luận: {}", e.getMessage());
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

    @GetMapping
    public ResponseEntity<?> getCommentsByPostId(@RequestParam Integer postId) {
        try {
            // Gọi service để lấy danh sách bình luận
            List<CommentResponseDto> comments = commentService.getCommentsByPostId(postId);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Lấy bình luận thành công");
            response.put("data", comments);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Lỗi khi lấy bình luận: {}", e.getMessage());
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

    @PutMapping("/{commentId}")
    public ResponseEntity<?> updateComment(@PathVariable Integer commentId,
                                           @RequestBody Map<String, Object> body) {
        try {
            Integer userId = (Integer) body.get("userId");
            String content = (String) body.get("content");

            CommentResponseDto updated = commentService.updateComment(commentId, userId, content);

            Map<String, Object> response = new HashMap<>();
            response.put("message", updated.getMessage());
            response.put("data", updated);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.error("Lỗi cập nhật bình luận: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        } catch (UnauthorizedException e) {
            logger.warn("Không có quyền sửa bình luận: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            logger.error("Lỗi hệ thống khi sửa bình luận", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", "error",
                    "message", "Lỗi hệ thống: " + e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Integer commentId) {
        try {
            commentService.deleteComment(commentId);
            return ResponseEntity.ok(Map.of("message", "Xóa bình luận thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}