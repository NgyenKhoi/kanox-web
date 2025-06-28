package com.example.social_media.dto.reaction;

public class ReactionRequestDto {
    private Integer userId;
    private Integer targetId;
    private String targetTypeCode;
    private String emojiName;

    public ReactionRequestDto() {
    }

    public ReactionRequestDto(Integer userId, String emojiName, String targetTypeCode, Integer targetId) {
        this.userId = userId;
        this.emojiName = emojiName;
        this.targetTypeCode = targetTypeCode;
        this.targetId = targetId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getEmojiName() {
        return emojiName;
    }

    public void setEmojiName(String emojiName) {
        this.emojiName = emojiName;
    }

    public String getTargetTypeCode() {
        return targetTypeCode;
    }

    public void setTargetTypeCode(String targetTypeCode) {
        this.targetTypeCode = targetTypeCode;
    }

    public Integer getTargetId() {
        return targetId;
    }

    public void setTargetId(Integer targetId) {
        this.targetId = targetId;
    }
}
