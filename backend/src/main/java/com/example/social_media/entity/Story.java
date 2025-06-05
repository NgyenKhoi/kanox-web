package com.example.social_media.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "tblStory", schema = "dbo")
public class Story {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ColumnDefault("getdate()")
    @Column(name = "created_at")
    private Instant createdAt;

    @ColumnDefault("dateadd(hour, 24, [created_at])")
    @Column(name = "expire_time")
    private Instant expireTime;

    @Size(max = 255)
    @Nationalized
    @Column(name = "caption")
    private String caption;

    @Size(max = 20)
    @ColumnDefault("'default'")
    @Column(name = "privacy_setting", length = 20)
    private String privacySetting;

    @Size(max = 50)
    @Column(name = "background_color", length = 50)
    private String backgroundColor;

    @ColumnDefault("1")
    @Column(name = "status")
    private Boolean status;

    @OneToMany(mappedBy = "story")
    private Set<StoryReply> tblStoryReplies = new LinkedHashSet<>();

    @OneToMany(mappedBy = "story")
    private Set<StoryViewer> storyViewers = new LinkedHashSet<>();

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public Set<StoryReply> getTblStoryReplies() {
        return tblStoryReplies;
    }

    public void setTblStoryReplies(Set<StoryReply> tblStoryReplies) {
        this.tblStoryReplies = tblStoryReplies;
    }

    public Set<StoryViewer> getTblStoryViewers() {
        return storyViewers;
    }

    public void setTblStoryViewers(Set<StoryViewer> storyViewers) {
        this.storyViewers = storyViewers;
    }

}