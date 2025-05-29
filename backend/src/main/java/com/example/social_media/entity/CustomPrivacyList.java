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
@Table(name = "tblCustomPrivacyLists", schema = "dbo")
public class CustomPrivacyList {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Size(max = 50)
    @Nationalized
    @Column(name = "list_name", length = 50)
    private String listName;

    @ColumnDefault("getdate()")
    @Column(name = "created_at")
    private Instant createdAt;

    @ColumnDefault("1")
    @Column(name = "status")
    private Boolean status;

    @OneToMany(mappedBy = "customList")
    private Set<ContentPrivacy> tblContentPrivacies = new LinkedHashSet<>();

    @OneToMany(mappedBy = "list")
    private Set<CustomPrivacyListMember> tblCustomPrivacyListMembers = new LinkedHashSet<>();

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getListName() {
        return listName;
    }

    public void setListName(String listName) {
        this.listName = listName;
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

    public Set<ContentPrivacy> getTblContentPrivacies() {
        return tblContentPrivacies;
    }

    public void setTblContentPrivacies(Set<ContentPrivacy> tblContentPrivacies) {
        this.tblContentPrivacies = tblContentPrivacies;
    }

    public Set<CustomPrivacyListMember> getTblCustomPrivacyListMembers() {
        return tblCustomPrivacyListMembers;
    }

    public void setTblCustomPrivacyListMembers(Set<CustomPrivacyListMember> tblCustomPrivacyListMembers) {
        this.tblCustomPrivacyListMembers = tblCustomPrivacyListMembers;
    }

}