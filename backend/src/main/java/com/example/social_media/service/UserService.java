package com.example.social_media.service;

import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;

    public UserService(UserRepository userRepository, ActivityLogService activityLogService) {
        this.userRepository = userRepository;
        this.activityLogService = activityLogService;
    }

    /**
     * Lấy danh sách người dùng với phân trang và tìm kiếm
     */
    public Page<User> getAllUsers(Pageable pageable, String search) {
        if (search != null && !search.isEmpty()) {
            // Search by email, username or displayName
            return userRepository.findByEmailContainingOrUsernameContainingOrDisplayNameContaining(
                    search, search, search, pageable);
        }
        return userRepository.findAll(pageable);
    }

    /**
     * Lấy thông tin người dùng theo ID
     */
    public User getUserById(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));
    }

    /**
     * Cập nhật thông tin người dùng
     */
    @Transactional
    public User updateUser(Integer userId, User userUpdate) {
        User existingUser = getUserById(userId);

        // Update changeable fields
        if (userUpdate.getDisplayName() != null) {
            existingUser.setDisplayName(userUpdate.getDisplayName());
        }
        if (userUpdate.getBio() != null) {
            existingUser.setBio(userUpdate.getBio());
        }
        if (userUpdate.getGender() != null) {
            existingUser.setGender(userUpdate.getGender());
        }
        if (userUpdate.getDateOfBirth() != null) {
            existingUser.setDateOfBirth(userUpdate.getDateOfBirth());
        }
        if (userUpdate.getProfilePrivacySetting() != null) {
            existingUser.setProfilePrivacySetting(userUpdate.getProfilePrivacySetting());
        }
        if (userUpdate.getPhoneNumber() != null) {
            existingUser.setPhoneNumber(userUpdate.getPhoneNumber());
        }

        // Lưu lại vào cơ sở dữ liệu
        return userRepository.save(existingUser);
    }

    /**
     * Cập nhật trạng thái người dùng (khóa/mở khóa)
     */
    @Transactional
    public User updateUserStatus(Integer userId, Boolean status) {
        User user = getUserById(userId);
        user.setStatus(status);
        
        // Log activity
        String action = status ? "UNLOCK_USER" : "LOCK_USER";
        activityLogService.logUserActivity(userId, action, "Admin changed user status");
        
        return userRepository.save(user);
    }
} 