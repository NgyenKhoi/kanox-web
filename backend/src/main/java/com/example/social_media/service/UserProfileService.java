package com.example.social_media.service;

import com.example.social_media.dto.user.UserProfileDto;
import com.example.social_media.dto.user.UserTagDto;
import com.example.social_media.dto.user.UserUpdateProfileDto;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.FollowRepository;
import com.example.social_media.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

    private final UserRepository userRepository;

    private final FollowRepository followRepository;

    public UserProfileService(UserRepository userRepository, FollowRepository followRepository) {
        this.userRepository = userRepository;
        this.followRepository = followRepository;
    }

    public UserProfileDto getUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int followerCount = followRepository.countByFolloweeAndStatusTrue(user);
        int followeeCount = followRepository.countByFollowerAndStatusTrue(user);

        return new UserProfileDto(
                user.getUsername(),
                user.getDisplayName(),
                user.getEmail(),
                user.getBio(),
                user.getGender(),
                user.getDateOfBirth(),
                followerCount,
                followeeCount
        );
    }

    @Transactional
    public UserProfileDto updateUserProfile(String username, UserUpdateProfileDto updateDto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setDisplayName(updateDto.getDisplayName());
        user.setBio(updateDto.getBio());
        user.setGender(updateDto.getGender());
        user.setDateOfBirth(updateDto.getDateOfBirth());

        int followerCount = followRepository.countByFolloweeAndStatusTrue(user);
        int followeeCount = followRepository.countByFollowerAndStatusTrue(user);

        return new UserProfileDto(
                user.getUsername(),
                user.getDisplayName(),
                user.getEmail(),
                user.getBio(),
                user.getGender(),
                user.getDateOfBirth(),
                followerCount,
                followeeCount
        );
    }
    public UserTagDto getUserTagByUsername(String username) {
        User user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        return new UserTagDto(user);
    }

    @Transactional
    public void updateProfilePrivacy(Integer userId, String privacySetting, Integer customListId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        // Giả sử bạn sử dụng JdbcTemplate để gọi stored procedure
        jdbcTemplate.update("EXEC sp_UpdateProfilePrivacy @user_id = ?, @privacy_setting = ?, @custom_list_id = ?",
                userId, privacySetting, customListId);
    }
}