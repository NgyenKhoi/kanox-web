package com.example.social_media.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;

import java.time.LocalDateTime;

@Document(indexName = "posts")
public class PostDocument {
    @Id
    private String id;
    private Integer ownerId;
    private String content;
    private LocalDateTime createdAt;
    private String privacySetting;

    public PostDocument() {
    }

    public PostDocument(String id, Integer ownerId, String content, LocalDateTime createdAt, String privacySetting) {
        this.id = id;
        this.ownerId = ownerId;
        this.content = content;
        this.createdAt = createdAt;
        this.privacySetting = privacySetting;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Integer getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Integer ownerId) {
        this.ownerId = ownerId;
    }

    public String getPrivacySetting() {
        return privacySetting;
    }

    public void setPrivacySetting(String privacySetting) {
        this.privacySetting = privacySetting;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
