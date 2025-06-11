package com.example.social_media.service;

import com.example.social_media.entity.ActionType;
import com.example.social_media.entity.ActivityLog;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.UserRepository;
import com.example.social_media.repository.ActivityLogRepository;
import com.example.social_media.repository.ActionTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class ActivityLogService {
    private final ActivityLogRepository activityLogRepository;
    private final ActionTypeRepository actionTypeRepository;
    private final UserRepository userRepository;

    public ActivityLogService(
            ActivityLogRepository activityLogRepository,
            ActionTypeRepository actionTypeRepository,
            UserRepository userRepository
    ) {
        this.activityLogRepository = activityLogRepository;
        this.actionTypeRepository = actionTypeRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void logActivity(Integer userId, String actionTypeName, String ipAddress, String device, Integer targetId, String targetType) {
        ActionType actionType = actionTypeRepository.findByName(actionTypeName)
                .orElseThrow(() -> new IllegalArgumentException("Invalid action type: " + actionTypeName));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        ActivityLog log = new ActivityLog();
        log.setUser(user);
        log.setActionType(actionType);
        log.setActionTime(Instant.now());
        log.setIpAddress(ipAddress);
        log.setDevice(device);
        log.setTargetId(targetId);
        log.setTargetType(targetType);
        log.setStatus(true);

        activityLogRepository.save(log);
    }
}