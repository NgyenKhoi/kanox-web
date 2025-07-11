package com.example.social_media.dto.post;

import com.example.social_media.dto.media.MediaDto;
import com.example.social_media.dto.user.UserTagDto;
import java.time.Instant;
import java.util.List;
import java.util.Map;

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
    private Integer groupId;
    private String groupName;
    private String groupAvatarUrl;
    private String groupPrivacyLevel;
    private Map<String, Long> reactionCountMap;
    private List<MediaDto> media;

    // Getters và setters
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
    public Integer getGroupId() { return groupId; }
    public void setGroupId(Integer groupId) { this.groupId = groupId; }
    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public String getGroupAvatarUrl() { return groupAvatarUrl; }
    public void setGroupAvatarUrl(String groupAvatarUrl) { this.groupAvatarUrl = groupAvatarUrl; }
    public String getGroupPrivacyLevel() { return groupPrivacyLevel; }
    public void setGroupPrivacyLevel(String groupPrivacyLevel) { this.groupPrivacyLevel = groupPrivacyLevel; }
    public Map<String, Long> getReactionCountMap() { return reactionCountMap; }
    public void setReactionCountMap(Map<String, Long> reactionCountMap) { this.reactionCountMap = reactionCountMap; }
    public List<MediaDto> getMedia() { return media; }
    public void setMedia(List<MediaDto> media) { this.media = media; }
}