package com.example.social_media.service;

import com.example.social_media.dto.media.MediaDto;
import com.example.social_media.dto.user.UserProfileDto;
import com.example.social_media.dto.user.UserTagDto;
import com.example.social_media.dto.user.UserUpdateProfileDto;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.FollowRepository;
import com.example.social_media.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final MediaService mediaService;
    private final GcsService gcsService;

    public UserProfileService(UserRepository userRepository, FollowRepository followRepository,
                              MediaService mediaService, GcsService gcsService) {
        this.userRepository = userRepository;
        this.followRepository = followRepository;
        this.mediaService = mediaService;
        this.gcsService = gcsService;
    }

    public UserProfileDto getUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Người dùng không tìm thấy"));

        int followerCount = followRepository.countByFolloweeAndStatusTrue(user);
        int followeeCount = followRepository.countByFollowerAndStatusTrue(user);

        String profileImageUrl = null;
        List<MediaDto> profileMedia = mediaService.getMediaByTargetDto(user.getId(), "PROFILE", "image", true);
        if (!profileMedia.isEmpty()) {
            profileImageUrl = profileMedia.getFirst().getUrl();
        }

        return new UserProfileDto(
                user.getId(), user.getUsername(), user.getDisplayName(), user.getEmail(),
                user.getBio(), user.getGender(), user.getDateOfBirth(),
                followerCount, followeeCount, profileImageUrl
        );
    }

    @Transactional
    public UserProfileDto updateUserProfile(String username, UserUpdateProfileDto updateDto, MultipartFile avatarFile) throws IOException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("Người dùng không tìm thấy"));

        user.setDisplayName(updateDto.getDisplayName());
        user.setBio(updateDto.getBio());
        user.setGender(updateDto.getGender());
        user.setDateOfBirth(updateDto.getDateOfBirth());

        String profileImageUrl = null;

        if (avatarFile != null && !avatarFile.isEmpty()) {
            profileImageUrl = gcsService.uploadFile(avatarFile);
            List<MediaDto> existingMedia = mediaService.getMediaByTargetDto(user.getId(), "PROFILE", "image", true);
            existingMedia.forEach(m -> m.setStatus(false));

            mediaService.saveMediaWithUrl(user.getId(), user.getId(), "PROFILE", "image", profileImageUrl, null);
        }

        userRepository.save(user);

        int followerCount = followRepository.countByFolloweeAndStatusTrue(user);
        int followeeCount = followRepository.countByFollowerAndStatusTrue(user);

        return new UserProfileDto(
                user.getId(), user.getUsername(), user.getDisplayName(), user.getEmail(),
                user.getBio(), user.getGender(), user.getDateOfBirth(),
                followerCount, followeeCount, profileImageUrl
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