package com.example.social_media.dto.user;

import java.io.Serializable;

public class UserTagDto implements Serializable {
    private static final long serialVersionUID = 1L;
    private Integer id;
    private String username;
    private String displayName;

    public UserTagDto() {}


    public UserTagDto(Integer id, String username, String displayName) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
}