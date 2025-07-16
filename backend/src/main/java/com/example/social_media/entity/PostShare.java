package com.example.social_media.entity;

import jakarta.persistence.*;

import java.time.Instant;

import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "tblPostShare")
public class PostShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "original_post_id", nullable = false)
    private Post originalPost;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shared_post_id", nullable = false, unique = true)
    private Post sharedPost;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "shared_at", nullable = false)
    private Instant sharedAt = Instant.now();

    @Column(name = "status", nullable = false)
    private Boolean status = true;

    // Getters and Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Post getOriginalPost() {
        return originalPost;
    }

    public void setOriginalPost(Post originalPost) {
        this.originalPost = originalPost;
    }

    public Post getSharedPost() {
        return sharedPost;
    }

    public void setSharedPost(Post sharedPost) {
        this.sharedPost = sharedPost;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Instant getSharedAt() {
        return sharedAt;
    }

    public void setSharedAt(Instant sharedAt) {
        this.sharedAt = sharedAt;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

    @Override
    public String toString() {
        return "PostShare{"
                + "id=" + id
                + ", originalPost=" + originalPost
                + ", sharedPost=" + sharedPost
                + ", user=" + user
                + ", sharedAt=" + sharedAt
                + ", status=" + status
                + '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof PostShare)) {
            return false;
        }
        PostShare postShare = (PostShare) o;
        return id != null && id.equals(postShare.id);

    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
