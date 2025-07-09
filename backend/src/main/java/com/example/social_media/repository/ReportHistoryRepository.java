package com.example.social_media.repository;

import com.example.social_media.entity.ReportHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportHistoryRepository extends JpaRepository<ReportHistory, Integer> {
    List<ReportHistory> findByReportId(Integer reportId);
}