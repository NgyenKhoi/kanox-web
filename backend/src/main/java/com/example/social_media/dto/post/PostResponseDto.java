package com.example.social_media.dto.post;

import com.example.social_media.dto.user.UserTagDto;

import java.time.Instant;
import java.util.List;

public class PostResponseDto {
    private Integer id;
    private UserTagDto owner;
    private String content;
    private String privacySetting;
    private Instant createdAt;
    private List<UserTagDto> taggedUsers;
    private int commentCount;
    private int likeCount;
    private int shareCount;
    private boolean isSaved;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public UserTagDto getOwner() { return owner; }
    public void setOwner(UserTagDto owner) { this.owner = owner; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getPrivacySetting() { return privacySetting; }
    public void setPrivacySetting(String privacySetting) { this.privacySetting = privacySetting; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public List<UserTagDto> getTaggedUsers() { return taggedUsers; }
    public void setTaggedUsers(List<UserTagDto> taggedUsers) { this.taggedUsers = taggedUsers; }

    public int getCommentCount() { return commentCount; }
    public void setCommentCount(int commentCount) { this.commentCount = commentCount; }

    public int getLikeCount() { return likeCount; }
    public void setLikeCount(int likeCount) { this.likeCount = likeCount; }

    public int getShareCount() { return shareCount; }
    public void setShareCount(int shareCount) { this.shareCount = shareCount; }

    public boolean isSaved() { return isSaved; }
    public void setSaved(boolean saved) { isSaved = saved; }
}