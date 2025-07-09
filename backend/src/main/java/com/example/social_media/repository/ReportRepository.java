package com.example.social_media.repository;

import com.example.social_media.dto.report.ReportResponseDto;
import com.example.social_media.entity.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReportRepository extends JpaRepository<Report, Integer> {

    @Procedure(procedureName = "sp_AddReport", outputParameterName = "report_id")
    Integer addReport(
            @Param("reporter_id") Integer reporterId,
            @Param("target_id") Integer targetId,
            @Param("target_type_id") Integer targetTypeId,
            @Param("reason_id") Integer reasonId,
            @Param("processing_status_id") Integer processingStatusId,
            @Param("status") Boolean status
    );

    @Procedure(procedureName = "sp_GetReports")
    List<ReportResponseDto> getReports(@Param("status") Boolean status);

    @Procedure(procedureName = "sp_UpdateReportStatus")
    void updateReportStatus(
            @Param("report_id") Integer reportId,
            @Param("admin_id") Integer adminId,
            @Param("processing_status_id") Integer processingStatusId
    );

    Page<Report> findByStatus(Boolean status, Pageable pageable);
    Optional<Report> findTopByOrderByIdDesc();
    Page<Report> findByProcessingStatusId(Integer processingStatusId, Pageable pageable);
}