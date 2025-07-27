package com.example.social_media.service;

import com.example.social_media.dto.user.UserLocationDto;
import com.example.social_media.entity.Location;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.LocationRepository;
import com.example.social_media.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.dao.DataAccessException;

import java.time.Instant;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final ActivityLogService activityLogService;
    
    @PersistenceContext
    private EntityManager entityManager;

    public UserService(
            UserRepository userRepository,
            LocationRepository locationRepository,
            ActivityLogService activityLogService) {
        this.userRepository = userRepository;
        this.locationRepository = locationRepository;
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
        System.out.println("[DEBUG] Starting updateUserStatus for userId: " + userId + ", status: " + status);
        
        User user = getUserById(userId);
        System.out.println("[DEBUG] Found user: " + user.getUsername() + ", current status: " + user.getStatus());
        
        try {
            // Thử cập nhật bằng JPA trước
            user.setStatus(status);
            System.out.println("[DEBUG] Set new status: " + status + ", attempting to save...");
            
            User savedUser = userRepository.save(user);
            System.out.println("[DEBUG] User saved successfully with status: " + savedUser.getStatus());
            
            // Log activity
            String action = status ? "UNLOCK_USER" : "LOCK_USER";
            activityLogService.logUserActivity(userId, action, "Admin changed user status");
            System.out.println("[DEBUG] Activity logged: " + action);
            
            return savedUser;
        } catch (DataAccessException e) {
            System.err.println("[ERROR] DataAccessException occurred: " + e.getMessage());
            e.printStackTrace();
            
            // Nếu gặp lỗi trigger (tblStoryViewer), sử dụng native query
            if (e.getMessage() != null && e.getMessage().contains("tblStoryViewer")) {
                System.out.println("[DEBUG] Using fallback method due to tblStoryViewer trigger issue");
                try {
                    // Tạm thời disable trigger
                    System.out.println("[DEBUG] Disabling trigger...");
                    entityManager.createNativeQuery("DISABLE TRIGGER trg_SoftDelete_User ON tblUser").executeUpdate();
                    
                    // Cập nhật trực tiếp bằng native query
                    System.out.println("[DEBUG] Updating user status with native query...");
                    entityManager.createNativeQuery("UPDATE tblUser SET status = ? WHERE id = ?")
                        .setParameter(1, status ? 1 : 0)
                        .setParameter(2, userId)
                        .executeUpdate();
                    
                    // Enable lại trigger
                    System.out.println("[DEBUG] Re-enabling trigger...");
                    entityManager.createNativeQuery("ENABLE TRIGGER trg_SoftDelete_User ON tblUser").executeUpdate();
                    
                    // Refresh entity
                    System.out.println("[DEBUG] Refreshing entity...");
                    entityManager.refresh(user);
                    
                    // Log activity
                    String action = status ? "UNLOCK_USER" : "LOCK_USER";
                    activityLogService.logUserActivity(userId, action, "Admin changed user status (fallback method)");
                    System.out.println("[DEBUG] Fallback method completed successfully");
                    
                    return user;
                } catch (Exception fallbackException) {
                    System.err.println("[ERROR] Fallback method failed: " + fallbackException.getMessage());
                    fallbackException.printStackTrace();
                    throw new RuntimeException("Failed to update user status: " + fallbackException.getMessage(), fallbackException);
                }
            } else {
                System.err.println("[ERROR] Non-trigger related DataAccessException, rethrowing...");
                throw e;
            }
        } catch (Exception e) {
            System.err.println("[ERROR] Unexpected exception in updateUserStatus: " + e.getMessage());
            e.printStackTrace();
            throw e;
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

    /**
     * Cập nhật vị trí quê quán của người dùng
     */
    @Transactional
    public void updateUserLocation(Integer userId, UserLocationDto locationDto) {
        User user = getUserById(userId);
        Location location = locationRepository.findByUserId(userId)
                .orElse(new Location());
        location.setUser(user);
        location.setLatitude(locationDto.getLatitude());
        location.setLongitude(locationDto.getLongitude());
        location.setLocationName(locationDto.getLocationName());
        location.setUpdatedAt(Instant.now());
        locationRepository.save(location);

        activityLogService.logUserActivity(userId, "UPDATE_LOCATION", "User updated their hometown location");
    }

    public long countAllUsers() {
        return userRepository.count();
    }
}