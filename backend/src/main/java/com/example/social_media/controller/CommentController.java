package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.comment.CommentRequestDto;
import com.example.social_media.dto.comment.CommentResponseDto;
import com.example.social_media.service.CommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(URLConfig.COMMENT_BASE)
public class CommentController {
    
    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping
    public ResponseEntity<?> createComment(@RequestBody CommentRequestDto request) {
        try {
            Integer commentId = commentService.createComment(
                    request.getUserId(),
                    request.getPostId(),
                    request.getContent(),
                    request.getPrivacySetting(),
                    request.getParentCommentId(),
                    request.getCustomListId()
            );
            return ResponseEntity.ok(new CommentResponseDto(commentId, "Comment created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new Exception(e.getMessage()));
        }
    }
}