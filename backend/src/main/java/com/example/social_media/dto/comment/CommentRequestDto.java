package com.example.social_media.dto.comment;

public class CommentRequestDto {
    private Integer userId;
    private Integer postId;
    private String content;
    private String privacySetting;
    private Integer parentCommentId;
    private Integer customListId;

    // Getters and setters
    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getPostId() {
        return postId;
    }

    public void setPostId(Integer postId) {
        this.postId = postId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getPrivacySetting() {
        return privacySetting;
    }

    public void setPrivacySetting(String privacySetting) {
        this.privacySetting = privacySetting;
    }

    public Integer getParentCommentId() {
        return parentCommentId;
    }

    public void setParentCommentId(Integer parentCommentId) {
        this.parentCommentId = parentCommentId;
    }

    public Integer getCustomListId() {
        return customListId;
    }

    public void setCustomListId(Integer customListId) {
        this.customListId = customListId;
    }
}