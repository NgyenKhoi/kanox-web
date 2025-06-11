package com.example.social_media.repository;

import com.example.social_media.entity.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NotificationStatusRepository extends JpaRepository<NotificationStatus, Short> {
    Optional<NotificationStatus> findByName(String name); // Thêm để tìm theo tên (unread)
}