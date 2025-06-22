package com.example.social_media.dto.comment;

import java.time.LocalDateTime;

public class CommentResponseDto {
    private Integer commentId;
    private String content;
    private String userDisplayName;
    private LocalDateTime createdAt;
    private String message;

    public CommentResponseDto(Integer commentId, String content, String userDisplayName,
            LocalDateTime createdAt, String message) {
        this.commentId = commentId;
        this.content = content;
        this.userDisplayName = userDisplayName;
        this.createdAt = createdAt;
        this.message = message;
    }

    // Getters and setters
    public Integer getCommentId() {
        return commentId;
    }

    public void setCommentId(Integer commentId) {
        this.commentId = commentId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getUserDisplayName() {
        return userDisplayName;
    }

    public void setUserDisplayName(String userDisplayName) {
        this.userDisplayName = userDisplayName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}