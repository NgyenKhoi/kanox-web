package com.example.social_media.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;
import org.hibernate.Hibernate;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class FollowId implements Serializable {
    private static final long serialVersionUID = -3370012840200336137L;
    @NotNull
    @Column(name = "follower_id", nullable = false)
    private Integer followerId;

    @NotNull
    @Column(name = "followee_id", nullable = false)
    private Integer followeeId;

    public FollowId(Integer followerId, Integer followeeId) {
    }

    public FollowId() {

    }

    public Integer getFollowerId() {
        return followerId;
    }

    public void setFollowerId(Integer followerId) {
        this.followerId = followerId;
    }

    public Integer getFolloweeId() {
        return followeeId;
    }

    public void setFolloweeId(Integer followeeId) {
        this.followeeId = followeeId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        FollowId entity = (FollowId) o;
        return Objects.equals(this.followeeId, entity.followeeId) &&
                Objects.equals(this.followerId, entity.followerId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(followeeId, followerId);
    }

}