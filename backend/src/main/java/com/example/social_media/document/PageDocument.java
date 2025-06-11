package com.example.social_media.document;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;

import java.time.LocalDateTime;

@Document(indexName = "pages")
@JsonIgnoreProperties(ignoreUnknown = true)

public class PageDocument {
    @Id
    private String id;
    private Integer ownerId;
    private String name;
    private String description;
    private LocalDateTime createdAt;

    public PageDocument() {
    }
    public PageDocument(String id, Integer ownerId, String name, String description, LocalDateTime createdAt) {
        this.id = id;
        this.ownerId = ownerId;
        this.name = name;
        this.description = description;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Integer getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Integer ownerId) {
        this.ownerId = ownerId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
