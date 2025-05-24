package com.example.social_media.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "tblHiddenPost", schema = "dbo")
public class HiddenPost {
    @EmbeddedId
    private HiddenPostId id;

    @ColumnDefault("getdate()")
    @Column(name = "hidden_time")
    private Instant hiddenTime;

    @ColumnDefault("1")
    @Column(name = "status")
    private Boolean status;

    public HiddenPostId getId() {
        return id;
    }

    public void setId(HiddenPostId id) {
        this.id = id;
    }

    public Instant getHiddenTime() {
        return hiddenTime;
    }

    public void setHiddenTime(Instant hiddenTime) {
        this.hiddenTime = hiddenTime;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

}