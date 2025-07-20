package com.example.social_media.service;

import com.example.social_media.dto.media.MediaDto;
import com.example.social_media.dto.privacy.ProfilePrivacySettingDto;
import com.example.social_media.dto.user.UserProfileDto;
import com.example.social_media.dto.user.UserTagDto;
import com.example.social_media.dto.user.UserUpdateProfileDto;
import com.example.social_media.entity.Location;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.FollowRepository;
import com.example.social_media.repository.LocationRepository;
import com.example.social_media.repository.UserRepository;
import com.example.social_media.repository.post_repository.PostRepository;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final PrivacyService privacyService;
    private final PostRepository postRepository;
    private final LocationRepository locationRepository;

    public UserProfileService(
            UserRepository userRepository,
            FollowRepository followRepository,
            MediaService mediaService,
            GcsService gcsService,
            PrivacyService privacyService,
            PostRepository postRepository,
            LocationRepository locationRepository) {
        this.userRepository = userRepository;
        this.followRepository = followRepository;
        this.mediaService = mediaService;
        this.gcsService = gcsService;
        this.privacyService = privacyService;
        this.postRepository = postRepository;
        this.locationRepository = locationRepository;
    }

    public UserProfileDto getUserProfile(String username) {
        User targetUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("Người dùng không tìm thấy"));

        // Lấy người đang đăng nhập
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new UserNotFoundException("Người dùng hiện tại không tìm thấy"));

        boolean hasAccess = privacyService.checkContentAccess(currentUser.getId(), targetUser.getId(), "PROFILE");

        String profileImageUrl = null;
        List<MediaDto> profileMedia = mediaService.getMediaByTargetDto(targetUser.getId(), "PROFILE", "image", true);
        if (!profileMedia.isEmpty()) {
            profileImageUrl = profileMedia.getFirst().getUrl();
        }

        int postCount = postRepository.countByOwnerAndStatusTrue(targetUser); // ✅ fix: truyền User

        // 👉 Lấy thêm cài đặt quyền riêng tư hồ sơ
        var profilePrivacy = privacyService.getProfilePrivacySetting(targetUser.getId());
        String profilePrivacySetting = profilePrivacy.getPrivacySetting();

        Location location = locationRepository.findByUserId(targetUser.getId()).orElse(null);
        Double latitude = location != null ? location.getLatitude() : null;
        Double longitude = location != null ? location.getLongitude() : null;
        String locationName = location != null ? location.getLocationName() : null;

        // Nếu không có quyền xem
        if (!hasAccess) {
            return new UserProfileDto(
                    targetUser.getId(),
                    targetUser.getUsername(),
                    targetUser.getDisplayName(),
                    null,
                    null,
                    null,
                    null,
                    0,
                    0,
                    profileImageUrl,
                    0,
                    profilePrivacySetting,
                    null,
                    latitude,
                    longitude,
                    locationName
            );
        }

        // Nếu có quyền xem đầy đủ
        int followerCount = followRepository.countByFolloweeAndStatusTrue(targetUser);
        int followeeCount = followRepository.countByFollowerAndStatusTrue(targetUser);

        return new UserProfileDto(
                targetUser.getId(),
                targetUser.getUsername(),
                targetUser.getDisplayName(),
                targetUser.getEmail(),
                targetUser.getBio(),
                targetUser.getGender(),
                targetUser.getDateOfBirth(),
                followerCount,
                followeeCount,
                profileImageUrl,
                postCount,
                profilePrivacySetting,
                targetUser.getPhoneNumber(),
                latitude,
                longitude,
                locationName
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
            mediaService.disableOldProfileMedia(user.getId());
            mediaService.saveMediaWithUrl(user.getId(), user.getId(), "PROFILE", "image", profileImageUrl, null);
        }

        userRepository.save(user);

        int followerCount = followRepository.countByFolloweeAndStatusTrue(user);
        int followeeCount = followRepository.countByFollowerAndStatusTrue(user);
        int postCount = postRepository.countByOwnerAndStatusTrue(user); // ✅ fix: dùng cùng kiểu

        ProfilePrivacySettingDto profilePrivacy = privacyService.getProfilePrivacySetting(user.getId());
        user.setPhoneNumber(updateDto.getPhoneNumber());

        Location location = locationRepository.findByUserId(user.getId()).orElse(null);
        Double latitude = location != null ? location.getLatitude() : null;
        Double longitude = location != null ? location.getLongitude() : null;
        String locationName = location != null ? location.getLocationName() : null;
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
                profileImageUrl,
                postCount,
                profilePrivacy.getPrivacySetting(),
                user.getPhoneNumber(),
                latitude,
                longitude,
                locationName
        );
    }

    public UserTagDto getUserTagByUsername(String username) {
        User user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("Người dùng không tìm thấy"));
        return new UserTagDto(user.getId(), user.getUsername(), user.getDisplayName());
    }

    @Transactional
    public void updateProfilePrivacy(Integer userId, String privacySetting, Integer customListId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng với id: " + userId));
        userRepository.updateProfilePrivacy(userId, privacySetting, customListId);
    }
}