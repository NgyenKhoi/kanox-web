package com.example.social_media.dto.reaction;

public class RemoveReactionRequestDto {
    private Integer userId;
    private Integer targetId;
    private String targetTypeCode;

    public RemoveReactionRequestDto(Integer userId, Integer targetId, String targetTypeCode) {
        this.userId = userId;
        this.targetId = targetId;
        this.targetTypeCode = targetTypeCode;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
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
