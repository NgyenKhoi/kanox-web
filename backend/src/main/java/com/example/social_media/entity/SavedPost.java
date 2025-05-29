package com.example.social_media.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "tblSavedPost", schema = "dbo")
public class SavedPost {
    @EmbeddedId
    private SavedPostId id;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @MapsId("postId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Post getPost() {
        return post;
    }

    public void setPost(Post post) {
        this.post = post;
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