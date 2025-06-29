package com.example.social_media.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;
import org.hibernate.Hibernate;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class ReactionId implements Serializable {
    private static final long serialVersionUID = 7232077145154021993L;
    @NotNull
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @NotNull
    @Column(name = "target_id", nullable = false)
    private Integer targetId;

    @NotNull
    @Column(name = "target_type_id", nullable = false)
    private Integer targetTypeId;

    public ReactionId(Integer userId, Integer targetId, Integer targetTypeId) {
        this.userId = userId;
        this.targetId = targetId;
        this.targetTypeId = targetTypeId;
    }

    public ReactionId() {
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getTargetId() {
        return targetId;
    }

    public void setTargetId(Integer targetId) {
        this.targetId = targetId;
    }

    public Integer getTargetTypeId() {
        return targetTypeId;
    }

    public void setTargetTypeId(Integer targetTypeId) {
        this.targetTypeId = targetTypeId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        ReactionId entity = (ReactionId) o;
        return Objects.equals(this.targetId, entity.targetId) &&
                Objects.equals(this.targetTypeId, entity.targetTypeId) &&
                Objects.equals(this.userId, entity.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(targetId, targetTypeId, userId);
    }

}