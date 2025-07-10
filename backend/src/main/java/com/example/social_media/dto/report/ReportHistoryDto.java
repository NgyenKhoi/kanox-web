package com.example.social_media.dto.report;

import java.time.Instant;

public class ReportHistoryDto {
    private Integer id;
    private Integer reporterId;
    private String reporterUsername;
    private Integer reportId;
    private Integer processingStatusId;
    private String processingStatusName;
    private Instant actionTime;
    private Boolean status;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getReporterId() {
        return reporterId;
    }

    public void setReporterId(Integer reporterId) {
        this.reporterId = reporterId;
    }

    public String getReporterUsername() {
        return reporterUsername;
    }

    public void setReporterUsername(String reporterUsername) {
        this.reporterUsername = reporterUsername;
    }

    public Integer getReportId() {
        return reportId;
    }

    public void setReportId(Integer reportId) {
        this.reportId = reportId;
    }

    public Integer getProcessingStatusId() {
        return processingStatusId;
    }

    public void setProcessingStatusId(Integer processingStatusId) {
        this.processingStatusId = processingStatusId;
    }

    public String getProcessingStatusName() {
        return processingStatusName;
    }

    public void setProcessingStatusName(String processingStatusName) {
        this.processingStatusName = processingStatusName;
    }

    public Instant getActionTime() {
        return actionTime;
    }

    public void setActionTime(Instant actionTime) {
        this.actionTime = actionTime;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }
}