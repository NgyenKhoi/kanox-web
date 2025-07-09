package com.example.social_media.repository;

import com.example.social_media.entity.ReportReason;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportReasonRepository extends JpaRepository<ReportReason, Integer> {
}