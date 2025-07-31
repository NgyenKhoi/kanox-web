package com.example.social_media.dto.user;


import com.example.social_media.entity.User;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class UserDto {
    private Integer id;
    private String username;
    private String displayName;
    private Short gender;
    private String bio;
    private Integer mutualFriendCount;
    private String reason;
    private Double distanceKm;
    private List<UserDto> mutualFriends;

    public UserDto() {}

    public UserDto(Integer id, String username, String displayName, Short gender, String bio) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.gender = gender;
        this.bio = bio;
    }

    public UserDto(com.example.social_media.entity.User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.displayName = user.getDisplayName();
        this.gender = user.getGender();
        this.bio = user.getBio();
    }

    public UserDto(Integer id, String username, String displayName) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
    }

    public UserDto(Integer id, String username, String displayName, String reason, Integer mutualFriendCount, Double distanceKm, List<UserDto> mutualFriends) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.reason = reason;
        this.mutualFriendCount = mutualFriendCount;
        this.distanceKm = distanceKm;
        this.mutualFriends = mutualFriends != null ? mutualFriends : new ArrayList<>();
    }



    // Getters and setters

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public Short getGender() {
        return gender;
    }

    public void setGender(Short gender) {
        this.gender = gender;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public Integer getMutualFriendCount() {
        return mutualFriendCount;
    }

    public void setMutualFriendCount(Integer mutualFriendCount) {
        this.mutualFriendCount = mutualFriendCount;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public List<UserDto> getMutualFriends() {
        return mutualFriends;
    }

    public void setMutualFriends(List<UserDto> mutualFriends) {
        this.mutualFriends = mutualFriends;
    }

    public String getReasonText() {
        if ("mutual_friends".equals(reason) && mutualFriendCount > 0) {
            return "Có " + mutualFriendCount + " bạn chung: " + mutualFriends;
        } else if ("location".equals(reason) && distanceKm != null && distanceKm > 0) {
            return "Sống cách bạn " + String.format("%.2f", distanceKm) + " km";
        }
        return "Gợi ý cho bạn";
    }
}

