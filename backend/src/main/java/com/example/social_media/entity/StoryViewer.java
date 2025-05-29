package com.example.social_media.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "tblStoryViewer", schema = "dbo")
public class StoryViewer {
    @EmbeddedId
    private StoryViewerId id;

    @MapsId("storyId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "story_id", nullable = false)
    private Story story;

    @MapsId("viewerId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "viewer_id", nullable = false)
    private User viewer;

    @ColumnDefault("getdate()")
    @Column(name = "view_time")
    private Instant viewTime;

    @ColumnDefault("1")
    @Column(name = "status")
    private Boolean status;

    public StoryViewerId getId() {
        return id;
    }

    public void setId(StoryViewerId id) {
        this.id = id;
    }

    public Story getStory() {
        return story;
    }

    public void setStory(Story story) {
        this.story = story;
    }

    public User getViewer() {
        return viewer;
    }

    public void setViewer(User viewer) {
        this.viewer = viewer;
    }

    public Instant getViewTime() {
        return viewTime;
    }

    public void setViewTime(Instant viewTime) {
        this.viewTime = viewTime;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

}