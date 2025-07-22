package com.example.social_media.dto.report;

import java.time.Instant;
import java.util.List;

public class ReportResponseDto {
    private Integer id;
    private Integer reporterId;
    private String reporterUsername;
    private Integer targetId;
    private Integer targetTypeId;
    private String targetTypeName;
    private ReportReasonDto reason;
    private Integer processingStatusId;
    private String processingStatusName;
    private Instant reportTime;
    private Boolean status;
    private String content; // Thêm trường content
    private List<String> imageUrls; // Thêm trường imageUrls

    // Getters and Setters
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

    public Integer getTargetId() {
        return targetId;
    }

    public void setTargetId(Integer targetId) {
        this.targetId = targetId;
    }

    public Integer getTargetTypeId() {
        return targetTypeId;
    }

    public void setTargetTypeId(Integer targetTypeId) {
        this.targetTypeId = targetTypeId;
    }

    public String getTargetTypeName() {
        return targetTypeName;
    }

    public void setTargetTypeName(String targetTypeName) {
        this.targetTypeName = targetTypeName;
    }

    public ReportReasonDto getReason() {
        return reason;
    }

    public void setReason(ReportReasonDto reason) {
        this.reason = reason;
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

    public Instant getReportTime() {
        return reportTime;
    }

    public void setReportTime(Instant reportTime) {
        this.reportTime = reportTime;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }
}