package com.example.social_media.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "tblReportStatus", schema = "dbo")
public class ReportStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @Size(max = 100)
    @NotNull
    @Nationalized
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Size(max = 255)
    @Nationalized
    @Column(name = "description")
    private String description;

    @ColumnDefault("1")
    @Column(name = "status")
    private Boolean status;

    @OneToMany(mappedBy = "processingStatus")
    private Set<Report> tblReports = new LinkedHashSet<>();

    @OneToMany(mappedBy = "processingStatus")
    private Set<ReportHistory> tblReportHistories = new LinkedHashSet<>();

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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

    public Set<Report> getTblReports() {
        return tblReports;
    }

    public void setTblReports(Set<Report> tblReports) {
        this.tblReports = tblReports;
    }

    public Set<ReportHistory> getTblReportHistories() {
        return tblReportHistories;
    }

    public void setTblReportHistories(Set<ReportHistory> tblReportHistories) {
        this.tblReportHistories = tblReportHistories;
    }
}