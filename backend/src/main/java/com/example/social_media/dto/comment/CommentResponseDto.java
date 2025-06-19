package com.example.social_media.dto.comment;

public class CommentResponseDto {
    private Integer commentId;
    private String message;

    public CommentResponseDto(Integer commentId, String message) {
        this.commentId = commentId;
        this.message = message;
    }

    public Integer getCommentId() {
        return commentId;
    }

    public void setCommentId(Integer commentId) {
        this.commentId = commentId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
