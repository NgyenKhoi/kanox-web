package com.example.social_media.repository;

import com.example.social_media.entity.Notification;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    Page<Notification> findByUserId(Integer userId, Pageable pageable);
    Optional<Notification> findByIdAndUserId(Integer id, Integer userId);
    @Modifying
    @Query("UPDATE Notification n SET n.status.id = :statusId WHERE n.user.id = :userId AND n.status.name != 'read'")
    void updateAllStatusByUserId(@Param("userId") Integer userId, @Param("statusId") Short statusId);
}