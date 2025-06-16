package com.example.social_media.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;
import org.hibernate.Hibernate;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class ContentPrivacyId implements Serializable {
    private static final long serialVersionUID = 3823145472597198078L;
    @NotNull
    @Column(name = "content_id", nullable = false)
    private Integer contentId;

    @NotNull
    @Column(name = "content_type_id", nullable = false)
    private Integer contentTypeId;

    public ContentPrivacyId(Integer contentId, Integer id) {
        this.contentId = contentId;
        this.contentTypeId = id;
    }

    public ContentPrivacyId() {
    }

    public Integer getContentId() {
        return contentId;
    }

    public void setContentId(Integer contentId) {
        this.contentId = contentId;
    }

    public Integer getContentTypeId() {
        return contentTypeId;
    }

    public void setContentTypeId(Integer contentTypeId) {
        this.contentTypeId = contentTypeId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        ContentPrivacyId entity = (ContentPrivacyId) o;
        return Objects.equals(this.contentId, entity.contentId) &&
                Objects.equals(this.contentTypeId, entity.contentTypeId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(contentId, contentTypeId);
    }

}