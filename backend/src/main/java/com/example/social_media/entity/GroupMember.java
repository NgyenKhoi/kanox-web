package com.example.social_media.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "tblGroupMember", schema = "dbo")
public class GroupMember {
    @EmbeddedId
    private GroupMemberId id;

    @MapsId("groupId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ColumnDefault("getdate()")
    @Column(name = "join_at")
    private Instant joinAt;

    @ColumnDefault("0")
    @Column(name = "is_admin")
    private Boolean isAdmin;

    @ColumnDefault("1")
    @Column(name = "status")
    private Boolean status;

    @Column(name = "invite_status")
    private String inviteStatus = "PENDING";

    @ColumnDefault("0")
    @Column(name = "is_owner")
    private Boolean isOwner = false;

    public GroupMemberId getId() {
        return id;
    }

    public void setId(GroupMemberId id) {
        this.id = id;
    }

    public Group getGroup() {
        return group;
    }

    public void setGroup(Group group) {
        this.group = group;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Instant getJoinAt() {
        return joinAt;
    }

    public void setJoinAt(Instant joinAt) {
        this.joinAt = joinAt;
    }

    public Boolean getIsAdmin() {
        return isAdmin;
    }

    public void setIsAdmin(Boolean isAdmin) {
        this.isAdmin = isAdmin;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

    public Boolean getAdmin() {
        return isAdmin;
    }

    public void setAdmin(Boolean admin) {
        isAdmin = admin;
    }

    public String getInviteStatus() {
        return inviteStatus;
    }

    public void setInviteStatus(String inviteStatus) {
        this.inviteStatus = inviteStatus;
    }

    public Boolean getIsOwner() {
        return isOwner != null && isOwner;
    }

    public void setIsOwner(Boolean isOwner) {
        this.isOwner = isOwner;
    }
}