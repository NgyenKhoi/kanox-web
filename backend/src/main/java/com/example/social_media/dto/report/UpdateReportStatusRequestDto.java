package com.example.social_media.dto.report;

import jakarta.validation.constraints.NotNull;

public class UpdateReportStatusRequestDto {

    @NotNull
    private Integer processingStatusId;


    public Integer getProcessingStatusId() {
        return processingStatusId;
    }

    public void setProcessingStatusId(Integer processingStatusId) {
        this.processingStatusId = processingStatusId;
    }
}