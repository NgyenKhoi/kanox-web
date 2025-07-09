package com.example.social_media.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "tblReportLimit", schema = "dbo")
public class ReportLimit {
    @Id
    @Column(name = "user_id", nullable = false)
    private Integer id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ColumnDefault("0")
    @Column(name = "report_count")
    private Integer reportCount;

    @ColumnDefault("getdate()")
    @Column(name = "last_report_reset")
    private Instant lastReportReset;

    @ColumnDefault("1")
    @Column(name = "status")
    private Boolean status;

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

    public Integer getReportCount() {
        return reportCount;
    }

    public void setReportCount(Integer reportCount) {
        this.reportCount = reportCount;
    }

    public Instant getLastReportReset() {
        return lastReportReset;
    }

    public void setLastReportReset(Instant lastReportReset) {
        this.lastReportReset = lastReportReset;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }
}