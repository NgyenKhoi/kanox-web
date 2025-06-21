// ChatDto.java
package com.example.social_media.dto.message;

public class ChatDto {
    private Integer id;
    private String name;
    private String lastMessage;
    private Integer unreadMessagesCount; // Thêm trường này

    public ChatDto() {}

    public ChatDto(Integer id, String name, String lastMessage, Integer unreadMessagesCount) {
        this.id = id;
        this.name = name;
        this.lastMessage = lastMessage;
        this.unreadMessagesCount = unreadMessagesCount;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLastMessage() { return lastMessage; }
    public void setLastMessage(String lastMessage) { this.lastMessage = lastMessage; }
    public Integer getUnreadMessagesCount() { return unreadMessagesCount; }
    public void setUnreadMessagesCount(Integer unreadMessagesCount) { this.unreadMessagesCount = unreadMessagesCount; }
}