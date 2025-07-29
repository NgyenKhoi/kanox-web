package com.example.social_media.repository.report;

import com.example.social_media.dto.report.ReportResponseDto;
import com.example.social_media.entity.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
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

    @Query(value = "UPDATE tblReport SET processing_status_id = ?3 WHERE id = ?1 AND status = 1", nativeQuery = true)
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    void updateReportStatus(Integer reportId, Integer adminId, Integer processingStatusId);

    @EntityGraph(attributePaths = {"reporter", "targetType", "reason", "processingStatus"})
    Page<Report> findByStatus(Boolean status, Pageable pageable);

    @EntityGraph(attributePaths = {"reporter", "targetType", "reason", "processingStatus"})
    Page<Report> findByProcessingStatusId(Integer processingStatusId, Pageable pageable);

    @EntityGraph(attributePaths = {"reporter", "targetType", "reason", "processingStatus"})
    Page<Report> findByTargetTypeId(Integer targetTypeId, Pageable pageable);

    @EntityGraph(attributePaths = {"reporter", "targetType", "reason", "processingStatus"})
    Page<Report> findByTargetTypeIdAndProcessingStatusId(Integer targetTypeId, Integer processingStatusId, Pageable pageable);

    @EntityGraph(attributePaths = {"reporter", "targetType", "reason", "processingStatus"})
    Optional<Report> findById(Integer id);

    @Query("SELECT COUNT(*) FROM Report r WHERE r.reporter.id = :reporterId AND r.processingStatus.id = :statusId AND r.reportTime >= :startOfDay AND r.status = true")
    long countByReporterIdAndProcessingStatusIdAndReportTime(
            @Param("reporterId") Integer reporterId,
            @Param("statusId") Integer statusId,
            @Param("startOfDay") Instant startOfDay
    );


    Optional<Report> findTopByOrderByIdDesc();

    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Report r " +
            "WHERE r.reporter.id = :reporterId AND r.targetId = :targetId AND r.targetType.id = :targetTypeId AND r.status = :status")
    boolean existsByReporterIdAndTargetIdAndTargetTypeIdAndStatus(
            @Param("reporterId") Integer reporterId,
            @Param("targetId") Integer targetId,
            @Param("targetTypeId") Integer targetTypeId,
            @Param("status") Boolean status
    );

    @Query("SELECT COUNT(r) FROM Report r WHERE r.targetId = :targetId AND r.targetType.id = :targetTypeId AND r.processingStatus.id = :processingStatusId AND r.status = :status")
    long countByTargetIdAndTargetTypeIdAndProcessingStatusIdAndStatus(
            @Param("targetId") Integer targetId,
            @Param("targetTypeId") Integer targetTypeId,
            @Param("processingStatusId") Integer processingStatusId,
            @Param("status") Boolean status
    );

    @Query("SELECT COUNT(r) FROM Report r JOIN Post p ON r.targetId = p.id " +
           "WHERE p.owner.id = :userId AND r.targetType.id = 1 AND r.processingStatus.id = 3 AND r.status = true")
    long countApprovedPostReportsByUserId(@Param("userId") Integer userId);

    @Procedure(procedureName = "sp_AutoBlockUser")
    void autoBlockUser(
            @Param("user_id") Integer targetUserId,
            @Param("admin_id") Integer adminId
    );

    @Procedure(procedureName = "sp_UpdateUserStatus")
    void updateUserStatus(
            @Param("user_id") Integer userId,
            @Param("admin_id") Integer adminId,
            @Param("new_status") Boolean newStatus
    );

    @Query("SELECT r FROM Report r WHERE r.reporterType = 'AI' AND r.targetType.id = :targetTypeId AND (:processingStatusId IS NULL OR r.processingStatus.id = :processingStatusId)")
    Page<Report> findByReporterTypeAIAndTargetTypeId(@Param("targetTypeId") Integer targetTypeId, @Param("processingStatusId") Integer processingStatusId, Pageable pageable);
}