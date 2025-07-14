package com.example.social_media.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "tblChat", schema = "dbo")
public class Chat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @ColumnDefault("0")
    @Column(name = "is_group")
    private Boolean isGroup;

    @Size(max = 100)
    @Nationalized
    @Column(name = "name", length = 100)
    private String name;

    @Column(name = "created_at")
    private Instant createdAt;

    @ColumnDefault("1")
    @Column(name = "status")
    private Boolean status;

    @OneToMany(mappedBy = "chat")
    private Set<CallSession> tblCallSessions = new LinkedHashSet<>();

    @OneToMany(mappedBy = "chat")
    private Set<ChatMember> tblChatMembers = new LinkedHashSet<>();

    @OneToMany(mappedBy = "chat")
    private Set<Message> tblMessages = new LinkedHashSet<>();

    public Chat() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Boolean getIsGroup() {
        return isGroup;
    }

    public void setIsGroup(Boolean isGroup) {
        this.isGroup = isGroup;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public Set<CallSession> getTblCallSessions() {
        return tblCallSessions;
    }

    public void setTblCallSessions(Set<CallSession> tblCallSessions) {
        this.tblCallSessions = tblCallSessions;
    }

    public Set<ChatMember> getTblChatMembers() {
        return tblChatMembers;
    }

    public void setTblChatMembers(Set<ChatMember> tblChatMembers) {
        this.tblChatMembers = tblChatMembers;
    }

    public Set<Message> getTblMessages() {
        return tblMessages;
    }

    public void setTblMessages(Set<Message> tblMessages) {
        this.tblMessages = tblMessages;
    }

}