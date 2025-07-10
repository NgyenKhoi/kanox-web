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
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final NotificationTypeRepository notificationTypeRepository;
    private final TargetTypeRepository targetTypeRepository;
    private final NotificationStatusRepository notificationStatusRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final MediaService mediaService;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public NotificationService(
            NotificationRepository notificationRepository,
            NotificationTypeRepository notificationTypeRepository,
            TargetTypeRepository targetTypeRepository,
            NotificationStatusRepository notificationStatusRepository,
            UserRepository userRepository,
            GroupRepository groupRepository,
            MediaService mediaService,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.notificationRepository = notificationRepository;
        this.notificationTypeRepository = notificationTypeRepository;
        this.targetTypeRepository = targetTypeRepository;
        this.notificationStatusRepository = notificationStatusRepository;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.mediaService = mediaService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public void sendNotification(Integer userId, String notificationTypeName, String message, Integer targetId, String targetTypeCode) {
        sendNotification(userId, notificationTypeName, message, targetId, targetTypeCode, null);
    }

    @Transactional
    public void sendNotification(Integer userId, String notificationTypeName, String message, Integer targetId, String targetTypeCode, String image) {
        NotificationType notificationType = notificationTypeRepository.findByNameAndStatus(notificationTypeName, true)
                .orElseThrow(() -> new IllegalArgumentException("Invalid notification type: " + notificationTypeName));

        TargetType targetType = targetTypeRepository.findByCode(targetTypeCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid target type: " + targetTypeCode));

        NotificationStatus status = notificationStatusRepository.findByName("unread")
                .orElseThrow(() -> new IllegalArgumentException("Invalid notification status: unread"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        String displayName;
        String username;
        String notificationImage = image;

        if ("GROUP".equals(targetTypeCode)) {
            Group group = groupRepository.findById(targetId)
                    .orElseThrow(() -> new IllegalArgumentException("Group not found with id: " + targetId));
            displayName = group.getName();
            username = group.getOwner().getUsername();
            if (notificationImage == null) {
                notificationImage = mediaService.getGroupAvatarUrl(targetId);
            }
        } else {
            User targetUser = userRepository.findById(targetId)
                    .orElseThrow(() -> new UserNotFoundException("User not found with id: " + targetId));
            displayName = targetUser.getDisplayName() != null ? targetUser.getDisplayName() : targetUser.getUsername();
            username = targetUser.getUsername();
            if (notificationImage == null) {
                notificationImage = mediaService.getAvatarUrlByUserId(targetId);
            }
        }

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
        notificationDto.setImage(notificationImage);

        System.out.println("Sending notification to /topic/notifications/" + userId + ": " + notificationDto);
        messagingTemplate.convertAndSend("/topic/notifications/" + userId, notificationDto);
    }

    public Page<NotificationDto> getNotifications(Integer userId, Pageable pageable) {
        return notificationRepository.findByUserId(userId, pageable).map(notification -> {
            String displayName;
            String username;
            String image;
            if ("GROUP".equals(notification.getTargetType().getCode())) {
                Group group = groupRepository.findById(notification.getTargetId())
                        .orElseThrow(() -> new IllegalArgumentException("Group not found with id: " + notification.getTargetId()));
                displayName = group.getName();
                username = group.getOwner().getUsername();
                image = mediaService.getGroupAvatarUrl(notification.getTargetId());
            } else {
                User targetUser = userRepository.findById(notification.getTargetId())
                        .orElseThrow(() -> new UserNotFoundException("User not found with id: " + notification.getTargetId()));
                displayName = targetUser.getDisplayName() != null ? targetUser.getDisplayName() : targetUser.getUsername();
                username = targetUser.getUsername();
                image = mediaService.getAvatarUrlByUserId(notification.getTargetId());
            }

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
            dto.setImage(image);
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

    @Transactional
    public void sendReportNotification(Integer userId, String notificationTypeName, String message, Integer adminId) {
        NotificationType notificationType = notificationTypeRepository.findByNameAndStatus(notificationTypeName, true)
                .orElseThrow(() -> new IllegalArgumentException("Invalid notification type: " + notificationTypeName));

        TargetType targetType = targetTypeRepository.findByCode("PROFILE")
                .orElseThrow(() -> new IllegalArgumentException("Invalid target type: PROFILE"));

        NotificationStatus status = notificationStatusRepository.findByName("unread")
                .orElseThrow(() -> new IllegalArgumentException("Invalid notification status: unread"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new UserNotFoundException("Admin not found with id: " + adminId));

        String displayName = admin.getDisplayName() != null ? admin.getDisplayName() : admin.getUsername();
        String username = admin.getUsername();
        String notificationImage = mediaService.getAvatarUrlByUserId(adminId);

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(notificationType);
        notification.setMessage(message.replace("{displayName}", displayName));
        notification.setCreatedAt(Instant.now());
        notification.setTargetId(adminId);
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
        notificationDto.setImage(notificationImage);

        messagingTemplate.convertAndSend("/topic/notifications/" + userId, notificationDto);
    }
}