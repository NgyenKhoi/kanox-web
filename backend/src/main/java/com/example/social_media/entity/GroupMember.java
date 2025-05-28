package com.example.social_media.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "tblGroupMember", schema = "dbo")
public class GroupMember {
    @EmbeddedId
    private GroupMemberId id;

    @ColumnDefault("getdate()")
    @Column(name = "join_at")
    private Instant joinAt;

    @ColumnDefault("0")
    @Column(name = "is_admin")
    private Boolean isAdmin;

    @ColumnDefault("1")
    @Column(name = "status")
    private Boolean status;

    public GroupMemberId getId() {
        return id;
    }

    public void setId(GroupMemberId id) {
        this.id = id;
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

}