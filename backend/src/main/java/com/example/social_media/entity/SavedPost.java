package com.example.social_media.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "tblSavedPost", schema = "dbo")
public class SavedPost {
    @EmbeddedId
    private SavedPostId id;

    @ColumnDefault("getdate()")
    @Column(name = "save_time")
    private Instant saveTime;

    @ColumnDefault("1")
    @Column(name = "status")
    private Boolean status;

    public SavedPostId getId() {
        return id;
    }

    public void setId(SavedPostId id) {
        this.id = id;
    }

    public Instant getSaveTime() {
        return saveTime;
    }

    public void setSaveTime(Instant saveTime) {
        this.saveTime = saveTime;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

}