package com.example.social_media.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "tblHiddenPost", schema = "dbo")
public class HiddenPost {
    @EmbeddedId
    private HiddenPostId id;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @MapsId("postId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

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