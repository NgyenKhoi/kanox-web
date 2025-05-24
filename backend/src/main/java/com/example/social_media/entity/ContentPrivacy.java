package com.example.social_media.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "tblContentPrivacy", schema = "dbo")
public class ContentPrivacy {
    @EmbeddedId
    private ContentPrivacyId id;

    @MapsId("contentTypeId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "content_type_id", nullable = false)
    private TargetType contentType;

    @Size(max = 20)
    @ColumnDefault("'default'")
    @Column(name = "privacy_setting", length = 20)
    private String privacySetting;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "custom_list_id")
    private CustomPrivacyList customList;

    @ColumnDefault("getdate()")
    @Column(name = "updated_at")
    private Instant updatedAt;

    @ColumnDefault("1")
    @Column(name = "status")
    private Boolean status;

    public ContentPrivacyId getId() {
        return id;
    }

    public void setId(ContentPrivacyId id) {
        this.id = id;
    }

    public TargetType getContentType() {
        return contentType;
    }

    public void setContentType(TargetType contentType) {
        this.contentType = contentType;
    }

    public String getPrivacySetting() {
        return privacySetting;
    }

    public void setPrivacySetting(String privacySetting) {
        this.privacySetting = privacySetting;
    }

    public CustomPrivacyList getCustomList() {
        return customList;
    }

    public void setCustomList(CustomPrivacyList customList) {
        this.customList = customList;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

}