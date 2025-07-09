package com.example.social_media.dto.report;

import jakarta.validation.constraints.NotNull;

public class CreateReportRequestDto {
    @NotNull
    private Integer reporterId;

    @NotNull
    private Integer targetId;

    @NotNull
    private Integer targetTypeId;

    @NotNull
    private Integer reasonId;

    // Getters and Setters
    public Integer getReporterId() {
        return reporterId;
    }

    public void setReporterId(Integer reporterId) {
        this.reporterId = reporterId;
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

    public Integer getReasonId() {
        return reasonId;
    }

    public void setReasonId(Integer reasonId) {
        this.reasonId = reasonId;
    }
}