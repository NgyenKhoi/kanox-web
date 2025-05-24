package com.example.social_media.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "tblPrivacySettings", schema = "dbo")
public class PrivacySetting {
    @Id
    @Column(name = "user_id", nullable = false)
    private Integer id;

    @Size(max = 20)
    @ColumnDefault("'public'")
    @Column(name = "post_viewer", length = 20)
    private String postViewer;

    @Size(max = 20)
    @ColumnDefault("'public'")
    @Column(name = "comment_viewer", length = 20)
    private String commentViewer;

    @Size(max = 20)
    @ColumnDefault("'public'")
    @Column(name = "story_viewer", length = 20)
    private String storyViewer;

    @Size(max = 20)
    @ColumnDefault("'public'")
    @Column(name = "profile_viewer", length = 20)
    private String profileViewer;

    @Size(max = 20)
    @ColumnDefault("'friends'")
    @Column(name = "message_viewer", length = 20)
    private String messageViewer;

    @ColumnDefault("getdate()")
    @Column(name = "updated_at")
    private Instant updatedAt;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getPostViewer() {
        return postViewer;
    }

    public void setPostViewer(String postViewer) {
        this.postViewer = postViewer;
    }

    public String getCommentViewer() {
        return commentViewer;
    }

    public void setCommentViewer(String commentViewer) {
        this.commentViewer = commentViewer;
    }

    public String getStoryViewer() {
        return storyViewer;
    }

    public void setStoryViewer(String storyViewer) {
        this.storyViewer = storyViewer;
    }

    public String getProfileViewer() {
        return profileViewer;
    }

    public void setProfileViewer(String profileViewer) {
        this.profileViewer = profileViewer;
    }

    public String getMessageViewer() {
        return messageViewer;
    }

    public void setMessageViewer(String messageViewer) {
        this.messageViewer = messageViewer;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

}