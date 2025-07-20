package com.example.social_media.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "tblPostAIModeration", schema = "dbo")
public class PostAIModeration {
    @Id
    @Column(name = "post_id", nullable = false)
    private Integer id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "post_id")
    private Post post;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "checked", nullable = false)
    private Boolean checked = false;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "flagged", nullable = false)
    private Boolean flagged = false;


    @ManyToOne
    @JoinColumn(name = "violation_reason_id")
    private ReportReason violationReason;

    @Column(name = "checked_at")
    private Instant checkedAt;
}