package com.example.social_media.repository.report;

import com.example.social_media.entity.ReportHistory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportHistoryRepository extends JpaRepository<ReportHistory, Integer> {

    @EntityGraph(attributePaths = {"reporter", "report", "processingStatus"})
    List<ReportHistory> findByReportId(Integer reportId);
}