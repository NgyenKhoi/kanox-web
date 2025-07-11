package com.example.social_media.dto.report;

import jakarta.validation.constraints.NotNull;

public class UpdateReportStatusRequestDto {
//    private Integer adminId;

    @NotNull
    private Integer processingStatusId;

    // Getters and Setters
//    public Integer getAdminId() {
//        return adminId;
//    }
//
//    public void setAdminId(Integer adminId) {
//        this.adminId = adminId;
//    }

    public Integer getProcessingStatusId() {
        return processingStatusId;
    }

    public void setProcessingStatusId(Integer processingStatusId) {
        this.processingStatusId = processingStatusId;
    }
}