package com.example.social_media.repository.report;

import com.example.social_media.entity.ReportReason;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReportReasonRepository extends JpaRepository<ReportReason, Integer> {
    Optional<ReportReason> findByName(String name);
}