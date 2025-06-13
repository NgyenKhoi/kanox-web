package com.example.social_media.repository;

import com.example.social_media.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    Page<Notification> findByUserId(Integer userId, Pageable pageable);
    Optional<Notification> findByIdAndUserId(Integer id, Integer userId); // Thêm để kiểm tra quyền
}