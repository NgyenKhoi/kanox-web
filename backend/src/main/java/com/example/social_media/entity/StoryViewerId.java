package com.example.social_media.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;
import org.hibernate.Hibernate;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class StoryViewerId implements Serializable {
    private static final long serialVersionUID = -5574959100092604274L;
    @NotNull
    @Column(name = "story_id", nullable = false)
    private Integer storyId;

    @NotNull
    @Column(name = "viewer_id", nullable = false)
    private Integer viewerId;

    public Integer getStoryId() {
        return storyId;
    }

    public void setStoryId(Integer storyId) {
        this.storyId = storyId;
    }

    public Integer getViewerId() {
        return viewerId;
    }

    public void setViewerId(Integer viewerId) {
        this.viewerId = viewerId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        StoryViewerId entity = (StoryViewerId) o;
        return Objects.equals(this.storyId, entity.storyId) &&
                Objects.equals(this.viewerId, entity.viewerId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(storyId, viewerId);
    }

}