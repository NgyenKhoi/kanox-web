package com.example.social_media.service;

import com.example.social_media.dto.user.UserLocationDto;
import com.example.social_media.entity.Location;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.LocationRepository;
import com.example.social_media.repository.UserRepository;
import com.example.social_media.repository.report.ReportRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final ActivityLogService activityLogService;
    private final ReportRepository reportRepository;

    public UserService(
            UserRepository userRepository,
            LocationRepository locationRepository,
            ActivityLogService activityLogService,
            ReportRepository reportRepository) {
        this.userRepository = userRepository;
        this.locationRepository = locationRepository;
        this.activityLogService = activityLogService;
        this.reportRepository = reportRepository;
    }


    public Page<User> getAllUsers(Pageable pageable, String search) {
        if (search != null && !search.isEmpty()) {
            // Search by email, username or displayName
            return userRepository.findByEmailContainingOrUsernameContainingOrDisplayNameContaining(
                    search, search, search, pageable);
        }
        return userRepository.findAll(pageable);
    }


    public User getUserById(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));
    }

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

    @Transactional
    public User updateUserStatus(Integer userId, Boolean status, Integer adminId) {
        System.out.println("[DEBUG] Starting updateUserStatus for userId: " + userId + ", status: " + status + ", adminId: " + adminId);
        
        User user = getUserById(userId);
        System.out.println("[DEBUG] Found user: " + user.getUsername() + ", current status: " + user.getStatus());
        
        // Kiểm tra nếu status đã giống rồi thì không cần update
        if (user.getStatus().equals(status)) {
            System.out.println("[DEBUG] Status already matches, no update needed");
            return user;
        }
        
        try {
            // Sử dụng stored procedure sp_UpdateUserStatus
            System.out.println("[DEBUG] Calling sp_UpdateUserStatus stored procedure...");
            System.out.println("[DEBUG] Parameters: userId=" + userId + ", adminId=" + adminId + ", newStatus=" + status);
            
            reportRepository.updateUserStatus(userId, adminId, status);
            
            // Refresh user object để lấy status mới nhất từ database
            User updatedUser = getUserById(userId);
            System.out.println("[DEBUG] User status updated successfully to: " + updatedUser.getStatus());
            
            return updatedUser;
            
        } catch (Exception e) {
            System.err.println("[ERROR] Exception in updateUserStatus: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to update user status: " + e.getMessage(), e);
        }
    }

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