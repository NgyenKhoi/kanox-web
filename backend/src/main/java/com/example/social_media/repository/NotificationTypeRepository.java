package com.example.social_media.repository;

import com.example.social_media.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface NotificationTypeRepository extends JpaRepository<NotificationType, Integer> {
    Optional<NotificationType> findByNameAndStatus(String name, Boolean status);
}