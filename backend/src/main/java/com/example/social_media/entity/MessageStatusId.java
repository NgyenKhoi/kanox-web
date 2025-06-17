package com.example.social_media.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;
import org.hibernate.Hibernate;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class MessageStatusId implements Serializable {
    private static final long serialVersionUID = -6608814988638974465L;
    @NotNull
    @Column(name = "message_id", nullable = false)
    private Integer messageId;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    public MessageStatusId(Integer messageId, Integer userId) {
        this.messageId = messageId;
        this.userId = userId;
    }

    public MessageStatusId() {
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        MessageStatusId entity = (MessageStatusId) o;
        return Objects.equals(this.messageId, entity.messageId) &&
                Objects.equals(this.userId, entity.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(messageId, userId);
    }

    public Integer getMessageId() {
        return messageId;
    }

    public void setMessageId(Integer messageId) {
        this.messageId = messageId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }
}