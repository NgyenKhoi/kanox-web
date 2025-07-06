package com.example.social_media.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@NamedStoredProcedureQuery(
        name = "sp_CreatePost",
        procedureName = "sp_CreatePost",
        parameters = {
                @StoredProcedureParameter(mode = ParameterMode.IN, name = "owner_id", type = Integer.class),
                @StoredProcedureParameter(mode = ParameterMode.IN, name = "content", type = String.class),
                @StoredProcedureParameter(mode = ParameterMode.IN, name = "privacy_setting", type = String.class),
                @StoredProcedureParameter(mode = ParameterMode.IN, name = "media_urls", type = String.class),
                @StoredProcedureParameter(mode = ParameterMode.IN, name = "tagged_user_ids", type = String.class),
                @StoredProcedureParameter(mode = ParameterMode.IN, name = "custom_list_id", type = Integer.class),
                @StoredProcedureParameter(mode = ParameterMode.IN, name = "group_id", type = Integer.class), // 👈 moved up
                @StoredProcedureParameter(mode = ParameterMode.OUT, name = "new_post_id", type = Integer.class) // 👈 moved down
        }
)
@Entity
@Table(name = "tblPost", schema = "dbo")
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ColumnDefault("getdate()")
    @Column(name = "created_at")
    private Instant createdAt;

    @Nationalized
    @Lob
    @Column(name = "content")
    private String content;

    @Size(max = 20)
    @ColumnDefault("'default'")
    @Column(name = "privacy_setting", length = 20)
    private String privacySetting;

    @ColumnDefault("1")
    @Column(name = "status")
    private Boolean status;

    @OneToMany(mappedBy = "post")
    private Set<Comment> tblComments = new LinkedHashSet<>();

    @OneToMany(mappedBy = "post")
    private Set<HiddenPost> tblHiddenPosts = new LinkedHashSet<>();

    @OneToMany(mappedBy = "post")
    private Set<PostTag> tblPostTags = new LinkedHashSet<>();

    @OneToMany(mappedBy = "post")
    private Set<SavedPost> tblSavedPosts = new LinkedHashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group group;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public User getOwner() {
        return owner;
    }

    public void setOwner(User owner) {
        this.owner = owner;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getPrivacySetting() {
        return privacySetting;
    }

    public void setPrivacySetting(String privacySetting) {
        this.privacySetting = privacySetting;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

    public Set<Comment> getTblComments() {
        return tblComments;
    }

    public void setTblComments(Set<Comment> tblComments) {
        this.tblComments = tblComments;
    }

    public Set<HiddenPost> getTblHiddenPosts() {
        return tblHiddenPosts;
    }

    public void setTblHiddenPosts(Set<HiddenPost> tblHiddenPosts) {
        this.tblHiddenPosts = tblHiddenPosts;
    }

    public Set<PostTag> getTblPostTags() {
        return tblPostTags;
    }

    public void setTblPostTags(Set<PostTag> tblPostTags) {
        this.tblPostTags = tblPostTags;
    }

    public Set<SavedPost> getTblSavedPosts() {
        return tblSavedPosts;
    }

    public void setTblSavedPosts(Set<SavedPost> tblSavedPosts) {
        this.tblSavedPosts = tblSavedPosts;
    }

    public Group getGroup() {
        return group;
    }
    public void setGroup(Group group) {
        this.group = group;
    }
}