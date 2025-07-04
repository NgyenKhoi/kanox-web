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
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping(consumes = {"multipart/form-data", "application/json"})
    public ResponseEntity<?> createComment(
            @RequestPart(value = "comment", required = false) @Valid CommentRequestDto request,
            @RequestPart(value = "media", required = false) List<MultipartFile> mediaFiles) {
        try {
            if (request == null) {
                throw new IllegalArgumentException("Dữ liệu bình luận không được cung cấp");
            }

            CommentResponseDto responseDto = commentService.createComment(
                    request.getUserId(),
                    request.getPostId(),
                    request.getContent(),
                    request.getPrivacySetting(),
                    request.getParentCommentId(),
                    request.getCustomListId(),
                    mediaFiles
            );

            Map<String, Object> response = new HashMap<>();
            response.put("message", responseDto.getMessage());
            response.put("data", responseDto);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Lỗi tạo bình luận: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", e.getMessage(),
                    "errors", new HashMap<>()
            ));
        } catch (Exception e) {
            logger.error("Lỗi hệ thống khi tạo bình luận", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", "error",
                    "message", "Lỗi hệ thống: " + e.getMessage(),
                    "errors", new HashMap<>()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<?> getCommentsByPostId(@RequestParam Integer postId) {
        try {
            List<CommentResponseDto> comments = commentService.getCommentsByPostId(postId);
            return ResponseEntity.ok(Map.of(
                    "message", "Lấy bình luận thành công",
                    "data", comments
            ));
        } catch (IllegalArgumentException e) {
            logger.error("Lỗi khi lấy bình luận: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", e.getMessage(),
                    "errors", new HashMap<>()
            ));
        } catch (Exception e) {
            logger.error("Lỗi hệ thống khi lấy bình luận", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", "error",
                    "message", "Lỗi hệ thống: " + e.getMessage(),
                    "errors", new HashMap<>()
            ));
        }
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<?> updateComment(@PathVariable Integer commentId,
                                           @RequestBody Map<String, Object> body) {
        try {
            Integer userId = (Integer) body.get("userId");
            String content = (String) body.get("content");

            CommentResponseDto updated = commentService.updateComment(commentId, userId, content);
            return ResponseEntity.ok(Map.of(
                    "message", updated.getMessage(),
                    "data", updated
            ));
        } catch (IllegalArgumentException e) {
            logger.error("Lỗi cập nhật bình luận: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
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
