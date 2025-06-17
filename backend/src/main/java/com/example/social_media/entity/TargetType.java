package com.example.social_media.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;

import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "tblTargetType", schema = "dbo")
public class TargetType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @Size(max = 50)
    @Column(name = "name", length = 50)
    private String name;

    @Size(max = 50)
    @Column(name = "code", length = 50)
    private String code;

    @OneToMany(mappedBy = "contentType")
    private Set<ContentPrivacy> tblContentPrivacies = new LinkedHashSet<>();

    @OneToMany(mappedBy = "targetType")
    private Set<Media> tblMedia = new LinkedHashSet<>();

    @OneToMany(mappedBy = "targetType")
    private Set<Notification> tblNotifications = new LinkedHashSet<>();

    @OneToMany(mappedBy = "targetType")
    private Set<Reaction> tblReactions = new LinkedHashSet<>();

    public TargetType() {
    }

    public TargetType(Integer id) {
        this.id = id;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Set<ContentPrivacy> getTblContentPrivacies() {
        return tblContentPrivacies;
    }

    public void setTblContentPrivacies(Set<ContentPrivacy> tblContentPrivacies) {
        this.tblContentPrivacies = tblContentPrivacies;
    }

    public Set<Media> getTblMedia() {
        return tblMedia;
    }

    public void setTblMedia(Set<Media> tblMedia) {
        this.tblMedia = tblMedia;
    }

    public Set<Notification> getTblNotifications() {
        return tblNotifications;
    }

    public void setTblNotifications(Set<Notification> tblNotifications) {
        this.tblNotifications = tblNotifications;
    }

    public Set<Reaction> getTblReactions() {
        return tblReactions;
    }

    public void setTblReactions(Set<Reaction> tblReactions) {
        this.tblReactions = tblReactions;
    }

}