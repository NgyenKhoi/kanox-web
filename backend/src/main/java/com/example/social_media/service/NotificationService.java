package com.example.social_media.service;

import com.example.social_media.dto.notification.NotificationDto;
import com.example.social_media.entity.*;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

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
        User targetUser = userRepository.findById(targetId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + targetId));
        String displayName = targetUser.getDisplayName() != null ? targetUser.getDisplayName() : targetUser.getUsername();
        String username = targetUser.getUsername();

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(notificationType);
        notification.setMessage(message.replace("{displayName}", displayName));
        notification.setCreatedAt(Instant.now());
        notification.setTargetId(targetId);
        notification.setTargetType(targetType);
        notification.setStatus(status);

        Notification savedNotification = notificationRepository.save(notification);

        NotificationDto notificationDto = new NotificationDto();
        notificationDto.setId(savedNotification.getId());
        notificationDto.setType(notificationType.getName());
        notificationDto.setMessage(savedNotification.getMessage());
        notificationDto.setTargetId(savedNotification.getTargetId());
        notificationDto.setTargetType(targetType.getCode());
        notificationDto.setDisplayName(displayName);
        notificationDto.setUsername(username);
        notificationDto.setCreatedAt(savedNotification.getCreatedAt());
        notificationDto.setStatus(status.getName());

        System.out.println("Sending notification to /topic/notifications/" + userId + ": " + notificationDto);
        messagingTemplate.convertAndSend("/topic/notifications/" + userId, notificationDto);
    }

    public Page<NotificationDto> getNotifications(Integer userId, Pageable pageable) {
        return notificationRepository.findByUserId(userId, pageable).map(notification -> {
            User targetUser = userRepository.findById(notification.getTargetId())
                    .orElseThrow(() -> new UserNotFoundException("User not found with id: " + notification.getTargetId()));
            String displayName = targetUser.getDisplayName() != null ? targetUser.getDisplayName() : targetUser.getUsername();
            String username = targetUser.getUsername();
            NotificationDto dto = new NotificationDto();
            dto.setId(notification.getId());
            dto.setType(notification.getType().getName());
            dto.setMessage(notification.getMessage());
            dto.setTargetId(notification.getTargetId());
            dto.setTargetType(notification.getTargetType().getCode());
            dto.setDisplayName(displayName);
            dto.setUsername(username);
            dto.setCreatedAt(notification.getCreatedAt());
            dto.setStatus(notification.getStatus().getName());
            return dto;
        });
    }

    @Transactional
    public void markAsRead(Integer notificationId, Integer userId, String statusName) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found or unauthorized"));

        NotificationStatus status = notificationStatusRepository.findByName(statusName)
                .orElseThrow(() -> new IllegalArgumentException("Invalid notification status: " + statusName));

        notification.setStatus(status);
        notificationRepository.save(notification);

        NotificationDto notificationDto = new NotificationDto();
        notificationDto.setId(notification.getId());
        notificationDto.setStatus(status.getName());
        messagingTemplate.convertAndSend("/topic/notifications/" + userId, notificationDto);
    }
}