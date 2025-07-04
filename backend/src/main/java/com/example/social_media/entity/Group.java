package com.example.social_media.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "tblGroup", schema = "dbo")
public class Group {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Size(max = 100)
    @Nationalized
    @Column(name = "name", length = 100)
    private String name;

    @Size(max = 255)
    @Nationalized
    @Column(name = "description")
    private String description;

    @ColumnDefault("getdate()")
    @Column(name = "created_at")
    private Instant createdAt;

    @ColumnDefault("1")
    @Column(name = "status")
    private Boolean status;

    @OneToMany(mappedBy = "group")
    private Set<GroupMember> tblGroupMembers = new LinkedHashSet<>();

    @OneToMany(mappedBy = "group")
    private Set<Post> tblPosts = new LinkedHashSet<>();

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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

    public Set<GroupMember> getTblGroupMembers() {
        return tblGroupMembers;
    }

    public void setTblGroupMembers(Set<GroupMember> tblGroupMembers) {
        this.tblGroupMembers = tblGroupMembers;
    }

    public Set<Post> getTblPosts() {
        return tblPosts;
    }

    public void setTblPosts(Set<Post> tblPosts) {
        this.tblPosts = tblPosts;
    }

}