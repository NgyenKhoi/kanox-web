package com.example.social_media.repository;

import com.example.social_media.entity.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportStatusRepository extends JpaRepository<ReportStatus, Integer> {
}