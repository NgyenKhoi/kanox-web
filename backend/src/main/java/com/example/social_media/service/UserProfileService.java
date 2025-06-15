package com.example.social_media.service;

import com.example.social_media.dto.user.UserProfileDto;
import com.example.social_media.dto.user.UserTagDto;
import com.example.social_media.dto.user.UserUpdateProfileDto;
import com.example.social_media.entity.Media;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.FollowRepository;
import com.example.social_media.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final MediaService mediaService; // Thêm MediaService

    public UserProfileService(UserRepository userRepository, FollowRepository followRepository, MediaService mediaService) {
        this.userRepository = userRepository;
        this.followRepository = followRepository;
        this.mediaService = mediaService;
    }

    public UserProfileDto getUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Người dùng không tìm thấy"));

        int followerCount = followRepository.countByFolloweeAndStatusTrue(user);
        int followeeCount = followRepository.countByFollowerAndStatusTrue(user);

        // Lấy ảnh đại diện từ tblMedia
        String profileImageUrl = null;
        List<Media> profileMedia = mediaService.getMediaByTarget(user.getId(), "PROFILE", "image", true);
        if (!profileMedia.isEmpty()) {
            profileImageUrl = profileMedia.get(0).getMediaUrl(); // Lấy URL của ảnh đầu tiên
        }

        return new UserProfileDto(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getEmail(),
                user.getBio(),
                user.getGender(),
                user.getDateOfBirth(),
                followerCount,
                followeeCount,
                profileImageUrl
        );
    }

    @Transactional
    public UserProfileDto updateUserProfile(String username, UserUpdateProfileDto updateDto) throws IOException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Người dùng không tìm thấy"));

        user.setDisplayName(updateDto.getDisplayName());
        user.setBio(updateDto.getBio());
        user.setGender(updateDto.getGender());
        user.setDateOfBirth(updateDto.getDateOfBirth());

        // Lưu hoặc cập nhật ảnh đại diện nếu có
        String profileImageUrl = updateDto.getProfileImageUrl();
        if (profileImageUrl != null) {
            // Nếu có profileImageUrl mới, cập nhật hoặc thêm vào tblMedia
            List<Media> existingMedia = mediaService.getMediaByTarget(user.getId(), "PROFILE", "image", true);
            if (!existingMedia.isEmpty()) {
                // Cập nhật media hiện có (giả sử chỉ có một ảnh đại diện)
                Media media = existingMedia.get(0);
                media.setMediaUrl(profileImageUrl);
                mediaService.uploadMedia(user.getId(), user.getId(), "PROFILE", "image", null, media.getCaption());
            } else {
                // Thêm media mới
                mediaService.uploadMedia(user.getId(), user.getId(), "PROFILE", "image", null, null);
            }
        }

        userRepository.save(user);

        int followerCount = followRepository.countByFolloweeAndStatusTrue(user);
        int followeeCount = followRepository.countByFollowerAndStatusTrue(user);

        return new UserProfileDto(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getEmail(),
                user.getBio(),
                user.getGender(),
                user.getDateOfBirth(),
                followerCount,
                followeeCount,
                profileImageUrl
        );
    }

    public UserTagDto getUserTagByUsername(String username) {
        User user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("Người dùng không tìm thấy"));
        return new UserTagDto(user);
    }

    @Transactional
    public void updateProfilePrivacy(Integer userId, String privacySetting, Integer customListId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng với id: " + userId));

        userRepository.updateProfilePrivacy(userId, privacySetting, customListId);
    }
}