package com.example.social_media.dto.comment;
import com.example.social_media.dto.media.MediaDto;
import com.example.social_media.dto.user.UserBasicDisplayDto;
import java.time.Instant;
import java.util.List;

public class CommentResponseDto {
    private Integer commentId;
    private String content;
    private UserBasicDisplayDto user;
    private Instant createdAt;
    private Instant updatedAt;
    private String message;
    private Integer userId;
    private List<CommentResponseDto> replies;
    private List<MediaDto> media;

    public CommentResponseDto(Integer commentId, String content, UserBasicDisplayDto user,
                              Instant createdAt, Instant updatedAt, String message, Integer userId, List<CommentResponseDto> replies, List<MediaDto> media) {
        this.commentId = commentId;
        this.content = content;
        this.user = user;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.message = message;
        this.userId = userId;
        this.replies = replies;
        this.media = media;
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

    public UserBasicDisplayDto getUser() { return user; }
    public void setUser(UserBasicDisplayDto user) { this.user = user; }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Integer getUserId() {
        return userId;
    }

    public List<CommentResponseDto> getReplies() {
        return replies;
    }

    public void setReplies(List<CommentResponseDto> replies) {
        this.replies = replies;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<MediaDto> getMedia() {
        return media;
    }
    public void setMedia(List<MediaDto> media) {
        this.media = media;
    }
}