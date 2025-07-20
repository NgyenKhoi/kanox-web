package com.example.social_media.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "tblPostFlag", schema = "dbo")
public class PostFlag {
    @Id
    @Column(name = "post_id", nullable = false)
    private Integer id;

    @Size(max = 255)
    @NotNull
    @Nationalized
    @Column(name = "flag_reason", nullable = false)
    private String flagReason;

    @NotNull
    @Column(name = "confidence_score", nullable = false)
    private Double confidenceScore;

    @Column(name = "flagged_at")
    private Instant flaggedAt;

    @ColumnDefault("0")
    @Column(name = "is_reviewed")
    private Boolean isReviewed;

    @ColumnDefault("1")
    @Column(name = "status")
    private Boolean status;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId // dùng nếu khóa chính của PostFlag chính là post_id (khóa chính & ngoại)
    @JoinColumn(name = "post_id")
    private Post post;

}