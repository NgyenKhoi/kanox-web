package com.example.social_media.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.time.Instant;

@Entity
@Table(name = "tblStory", schema = "dbo")
public class Story {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "expire_time", nullable = false)
    private Instant expireTime;

    @Size(max = 255)
    @Nationalized
    @Column(name = "caption")
    private String caption;

    @Size(max = 255)
    @Column(name = "media_url")
    private String mediaUrl;

    @Size(max = 10)
    @Column(name = "media_type", length = 10)
    private String mediaType;

    @Size(max = 20)
    @Column(name = "privacy_setting", length = 20)
    private String privacySetting;

    @Size(max = 50)
    @Column(name = "background_color", length = 50)
    private String backgroundColor;

    @Column(name = "status", columnDefinition = "bit default 1")
    private Boolean status;

    public Story() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.expireTime = now.plusSeconds(24 * 3600); // +24 hours
        this.privacySetting = "default";
        this.status = true;
    }

    // getters và setters ...

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getExpireTime() {
        return expireTime;
    }

    public void setExpireTime(Instant expireTime) {
        this.expireTime = expireTime;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }

    public String getMediaUrl() {
        return mediaUrl;
    }

    public void setMediaUrl(String mediaUrl) {
        this.mediaUrl = mediaUrl;
    }

    public String getMediaType() {
        return mediaType;
    }

    public void setMediaType(String mediaType) {
        this.mediaType = mediaType;
    }

    public String getPrivacySetting() {
        return privacySetting;
    }

    public void setPrivacySetting(String privacySetting) {
        this.privacySetting = privacySetting;
    }

    public String getBackgroundColor() {
        return backgroundColor;
    }

    public void setBackgroundColor(String backgroundColor) {
        this.backgroundColor = backgroundColor;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }
}