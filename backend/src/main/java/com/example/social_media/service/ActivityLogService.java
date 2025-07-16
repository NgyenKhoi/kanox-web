package com.example.social_media.service;

import com.example.social_media.dto.activity.ActivityLogDto;
import com.example.social_media.entity.ActionType;
import com.example.social_media.entity.ActivityLog;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.UserRepository;
import com.example.social_media.repository.ActivityLogRepository;
import com.example.social_media.repository.ActionTypeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

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

    @Transactional
    public void logUserActivity(Integer userId, String actionTypeName, String description) {
        ActionType actionType = actionTypeRepository.findByName(actionTypeName)
                .orElseThrow(() -> new IllegalArgumentException("Invalid action type: " + actionTypeName));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        ActivityLog log = new ActivityLog();
        log.setUser(user);
        log.setActionType(actionType);
        log.setActionTime(Instant.now());
        log.setTargetType(description);
        log.setStatus(true);

        activityLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<ActivityLogDto> getRecentActivities(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ActivityLog> activities = activityLogRepository.findRecentActivities(pageable);
        return activities.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private ActivityLogDto convertToDto(ActivityLog activity) {
        String title = formatTitle(activity);
        String time = formatTime(activity.getActionTime());
        return new ActivityLogDto(title, time);
    }

    private String formatTitle(ActivityLog activity) {
        String userName = activity.getUser() != null ? activity.getUser().getUsername() : "Người dùng ẩn danh";
        String actionName = activity.getActionType().getName();
        String target = activity.getTargetType() != null && activity.getTargetId() != null
                ? activity.getTargetType() + " ID #" + activity.getTargetId()
                : activity.getTargetType() != null ? activity.getTargetType() : "";

        switch (actionName.toUpperCase()) {
            case "USER_SOFT_DELETE":
                return userName + " đã bị xóa tài khoản tạm thời" + (target.isEmpty() ? "" : " trên " + target);
            case "POST_CREATE":
                return userName + " đã tạo bài viết " + target;
            case "COMMENT_CREATE":
                return userName + " đã bình luận trên " + target;
            case "STORY_CREATE":
                return userName + " đã tạo câu chuyện " + target;
            case "FRIEND_REQUEST_SENT":
                return userName + " đã gửi yêu cầu kết bạn" + (target.isEmpty() ? "" : " tới " + target);
            case "FRIEND_REQUEST_ACCEPTED":
                return userName + " đã chấp nhận yêu cầu kết bạn" + (target.isEmpty() ? "" : " từ " + target);
            case "FOLLOW":
                return userName + " đã theo dõi " + target;
            case "UNFOLLOW":
                return userName + " đã bỏ theo dõi " + target;
            case "LOCK_USER":
                return userName + " đã khóa tài khoản " + target;
            case "UNLOCK_USER":
                return userName + " đã mở khóa tài khoản " + target;
            case "GRANT_ADMIN":
                return userName + " đã được cấp quyền admin" + (target.isEmpty() ? "" : " cho " + target);
            case "REVOKE_ADMIN":
                return userName + " đã bị thu hồi quyền admin" + (target.isEmpty() ? "" : " từ " + target);
            case "ACTIVATE_BANNED_KEYWORD":
                return userName + " đã kích hoạt từ khóa bị cấm: " + target;
            case "DEACTIVATE_BANNED_KEYWORD":
                return userName + " đã hủy kích hoạt từ khóa bị cấm: " + target;
            case "REPORT_ABUSE_WARNING":
                return userName + " nhận cảnh báo lạm dụng báo cáo" + (target.isEmpty() ? "" : " trên " + target);
            case "MARK_CHAT_SPAM":
                return userName + " đã đánh dấu thành viên chat là spam: " + target;
            case "UNMARK_CHAT_SPAM":
                return userName + " đã bỏ đánh dấu spam cho thành viên chat: " + target;
            case "REPORT_SUBMITTED":
                return userName + " đã gửi báo cáo " + target;
            case "REPORT_STATUS_UPDATED":
                return userName + " đã cập nhật trạng thái báo cáo " + target;
            default:
                return userName + " đã thực hiện hành động: " + actionName + (target.isEmpty() ? "" : " trên " + target);
        }
    }

    private String formatTime(Instant actionTime) {
        long minutes = ChronoUnit.MINUTES.between(actionTime, Instant.now());
        if (minutes < 60) {
            return minutes + " phút trước";
        } else if (minutes < 1440) {
            return (minutes / 60) + " giờ trước";
        } else {
            return (minutes / 1440) + " ngày trước";
        }
    }
}