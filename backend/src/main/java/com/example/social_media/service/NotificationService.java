package com.example.social_media.service;

import com.example.social_media.dto.notification.NotificationDto;
import com.example.social_media.entity.*;
import com.example.social_media.exception.RegistrationException;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final NotificationTypeRepository notificationTypeRepository;
    private final TargetTypeRepository targetTypeRepository;
    private final NotificationStatusRepository notificationStatusRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(
            NotificationRepository notificationRepository,
            NotificationTypeRepository notificationTypeRepository,
            TargetTypeRepository targetTypeRepository,
            NotificationStatusRepository notificationStatusRepository,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.notificationRepository = notificationRepository;
        this.notificationTypeRepository = notificationTypeRepository;
        this.targetTypeRepository = targetTypeRepository;
        this.notificationStatusRepository = notificationStatusRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public void sendNotification(Integer userId, String notificationTypeName, String message, Integer targetId, String targetTypeCode) {
        NotificationType notificationType = notificationTypeRepository.findByNameAndStatus(notificationTypeName, true)
                .orElseThrow(() -> new IllegalArgumentException("Invalid notification type: " + notificationTypeName));

        TargetType targetType = targetTypeRepository.findByCode(targetTypeCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid target type: " + targetTypeCode));

        NotificationStatus status = notificationStatusRepository.findByName("unread")
                .orElseThrow(() -> new IllegalArgumentException("Invalid notification status: unread"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(notificationType);
        notification.setMessage(message);
        notification.setCreatedAt(Instant.now());
        notification.setTargetId(targetId);
        notification.setTargetType(targetType);
        notification.setStatus(status);

        notificationRepository.save(notification);

        messagingTemplate.convertAndSend("/topic/notifications/" + userId, Map.of(
                "id", notification.getId(),
                "message", notification.getMessage(),
                "type", notification.getType().getName(),
                "targetId", notification.getTargetId(),
                "targetType", notification.getTargetType().getCode(),
                "createdAt", notification.getCreatedAt().toString(),
                "status", notification.getStatus().getName()
        ));
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> getNotifications(Integer userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        Page<Notification> notifications = notificationRepository.findByUserId(userId, pageable);
        return notifications.map(notification -> new NotificationDto(
                notification.getId(),
                notification.getMessage(),
                notification.getType().getName(),
                notification.getTargetId(),
                notification.getTargetType() != null ? notification.getTargetType().getCode() : null,
                notification.getCreatedAt(),
                notification.getStatus().getName()
        ));
    }

    @Transactional
    public void markAsRead(Long notificationId, Integer userId, String statusName) {
        NotificationStatus status = notificationStatusRepository.findByName(statusName)
                .orElseThrow(() -> new IllegalArgumentException("Invalid notification status: " + statusName));
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found or not accessible"));
        notification.setStatus(status);
        notificationRepository.save(notification);

        messagingTemplate.convertAndSend("/topic/notifications/" + userId, Map.of(
                "id", notification.getId(),
                "status", notification.getStatus().getName()
        ));
    }
}