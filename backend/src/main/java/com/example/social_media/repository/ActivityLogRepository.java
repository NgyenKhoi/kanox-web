package com.example.social_media.repository;

import com.example.social_media.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Integer> {
    @Query("SELECT a FROM ActivityLog a WHERE a.status = true ORDER BY a.actionTime DESC")
    Page<ActivityLog> findRecentActivities(Pageable pageable);
}