package com.example.social_media.dto;

import java.time.Instant;

public class ChatDto {
    private Integer id;
    private String name;
    private String lastMessage;

    // Constructor không tham số (yêu cầu của JPA/Hibernate)
    public ChatDto() {}

    // Constructor đầy đủ
    public ChatDto(Integer id, String name, String lastMessage) {
        this.id = id;
        this.name = name;
        this.lastMessage = lastMessage;
    }

    // Getters and setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLastMessage() { return lastMessage; }
    public void setLastMessage(String lastMessage) { this.lastMessage = lastMessage; }
}