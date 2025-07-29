package com.example.social_media.dto.group;

import com.example.social_media.dto.user.UserBasicDisplayDto;

import java.util.List;

public class GroupDisplayDto {
    private Integer id;
    private String name;
    private String avatarUrl;
    private String description;
    private String createdAt;
    private Integer memberCount;
    private String ownerUsername;
    private String ownerDisplayName;
    private String ownerAvatarUrl;
    private boolean isAdmin;
    private boolean isOwner;
    private boolean isMember;
    private String privacyLevel;
    private String inviteStatus;
    private List<UserBasicDisplayDto> mutualFriendsInGroup;
    private Boolean status;

    public GroupDisplayDto() {
    }

    public GroupDisplayDto(Integer id, String name, String avatarUrl, String description,
                           String createdAt, Integer memberCount, String ownerUsername,
                           String ownerDisplayName, String ownerAvatarUrl,
                           boolean isAdmin, boolean isOwner,
                           boolean isMember,
                           String privacyLevel, String inviteStatus,
                           List<UserBasicDisplayDto> mutualFriendsInGroup, Boolean status) {
        this.id = id;
        this.name = name;
        this.avatarUrl = avatarUrl;
        this.description = description;
        this.createdAt = createdAt;
        this.memberCount = memberCount;
        this.ownerUsername = ownerUsername;
        this.ownerDisplayName = ownerDisplayName;
        this.ownerAvatarUrl = ownerAvatarUrl;
        this.isAdmin = isAdmin;
        this.isOwner = isOwner;
        this.isMember = isMember;
        this.privacyLevel = privacyLevel;
        this.inviteStatus = inviteStatus;
        this.mutualFriendsInGroup = mutualFriendsInGroup;
        this.status = status;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getMemberCount() {
        return memberCount;
    }

    public void setMemberCount(Integer memberCount) {
        this.memberCount = memberCount;
    }

    public String getOwnerUsername() {
        return ownerUsername;
    }

    public void setOwnerUsername(String ownerUsername) {
        this.ownerUsername = ownerUsername;
    }

    public String getOwnerDisplayName() {
        return ownerDisplayName;
    }

    public void setOwnerDisplayName(String ownerDisplayName) {
        this.ownerDisplayName = ownerDisplayName;
    }

    public String getOwnerAvatarUrl() {
        return ownerAvatarUrl;
    }

    public void setOwnerAvatarUrl(String ownerAvatarUrl) {
        this.ownerAvatarUrl = ownerAvatarUrl;
    }

    public boolean isAdmin() {
        return isAdmin;
    }

    public void setAdmin(boolean admin) {
        isAdmin = admin;
    }

    public boolean isOwner() {
        return isOwner;
    }

    public void setOwner(boolean owner) {
        isOwner = owner;
    }

    public String getPrivacyLevel() {
        return privacyLevel;
    }

    public void setPrivacyLevel(String privacyLevel) {
        this.privacyLevel = privacyLevel;
    }

    public String getInviteStatus() {
        return inviteStatus;
    }

    public void setInviteStatus(String inviteStatus) {
        this.inviteStatus = inviteStatus;
    }

    public boolean isMember() {
        return isMember;
    }

    public void setMember(boolean member) {
        isMember = member;
    }

    public List<UserBasicDisplayDto> getMutualFriendsInGroup() {
        return mutualFriendsInGroup;
    }

    public void setMutualFriendsInGroup(List<UserBasicDisplayDto> mutualFriendsInGroup) {
        this.mutualFriendsInGroup = mutualFriendsInGroup;
    }
    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }
}
