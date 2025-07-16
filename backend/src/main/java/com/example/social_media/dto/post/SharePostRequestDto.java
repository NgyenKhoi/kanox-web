package com.example.social_media.dto.post;

public class SharePostRequestDto {

    private Integer originalPostId;
    private String content; // Nội dung người dùng viết thêm khi chia sẻ

    public Integer getOriginalPostId() {
        return originalPostId;
    }

    public void setOriginalPostId(Integer originalPostId) {
        this.originalPostId = originalPostId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
