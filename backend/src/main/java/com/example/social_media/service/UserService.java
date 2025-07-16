package com.example.social_media.service;

import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.dao.DataAccessException;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    
    @PersistenceContext
    private EntityManager entityManager;

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
        
        try {
            // Thử cập nhật bằng JPA trước
            user.setStatus(status);
            User savedUser = userRepository.save(user);
            
            // Log activity
            String action = status ? "UNLOCK_USER" : "LOCK_USER";
            activityLogService.logUserActivity(userId, action, "Admin changed user status");
            
            return savedUser;
        } catch (DataAccessException e) {
            // Nếu gặp lỗi trigger (tblStoryViewer), sử dụng native query
            if (e.getMessage() != null && e.getMessage().contains("tblStoryViewer")) {
                try {
                    // Tạm thời disable trigger
                    entityManager.createNativeQuery("DISABLE TRIGGER trg_SoftDelete_User ON tblUser").executeUpdate();
                    
                    // Cập nhật trực tiếp bằng native query
                    entityManager.createNativeQuery("UPDATE tblUser SET status = ? WHERE id = ?")
                        .setParameter(1, status ? 1 : 0)
                        .setParameter(2, userId)
                        .executeUpdate();
                    
                    // Enable lại trigger
                    entityManager.createNativeQuery("ENABLE TRIGGER trg_SoftDelete_User ON tblUser").executeUpdate();
                    
                    // Refresh entity
                    entityManager.refresh(user);
                    
                    // Log activity
                    String action = status ? "UNLOCK_USER" : "LOCK_USER";
                    activityLogService.logUserActivity(userId, action, "Admin changed user status (fallback method)");
                    
                    return user;
                } catch (Exception fallbackException) {
                    throw new RuntimeException("Failed to update user status: " + fallbackException.getMessage(), fallbackException);
                }
            } else {
                throw e;
            }
        }
    }
    
    /**
     * Cập nhật quyền admin cho người dùng
     */
    @Transactional
    public User updateAdminRole(Integer userId, Boolean isAdmin) {
        User user = getUserById(userId);
        user.setIsAdmin(isAdmin);
        
        // Log activity
        String action = isAdmin ? "GRANT_ADMIN" : "REVOKE_ADMIN";
        activityLogService.logUserActivity(userId, action, "Admin role updated");
        
        return userRepository.save(user);
    }

    public long countAllUsers() {
        return userRepository.count();
    }
}