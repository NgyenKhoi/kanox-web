package com.example.social_media.service;

import com.example.social_media.dto.media.MediaDto;
import com.example.social_media.dto.user.UserProfileDto;
import com.example.social_media.dto.user.UserTagDto;
import com.example.social_media.dto.user.UserUpdateProfileDto;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.FollowRepository;
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

    public UserProfileService(
            UserRepository userRepository,
            FollowRepository followRepository,
            MediaService mediaService,
            GcsService gcsService,
            PrivacyService privacyService,
            PostRepository postRepository
    ) {
        this.userRepository = userRepository;
        this.followRepository = followRepository;
        this.mediaService = mediaService;
        this.gcsService = gcsService;
        this.privacyService = privacyService;
        this.postRepository = postRepository;
    }

    public UserProfileDto getUserProfile(String username) {
        User targetUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("Người dùng không tìm thấy"));

        // Lấy thông tin người dùng hiện tại (người xem hồ sơ)
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new UserNotFoundException("Người dùng hiện tại không tìm thấy"));

        // Kiểm tra quyền truy cập vào hồ sơ
        boolean hasAccess = privacyService.checkContentAccess(
                currentUser.getId(),
                targetUser.getId(),
                "PROFILE"
        );

        String profileImageUrl = null;
        List<MediaDto> profileMedia = mediaService.getMediaByTargetDto(targetUser.getId(), "PROFILE", "image", true);
        if (!profileMedia.isEmpty()) {
            profileImageUrl = profileMedia.getFirst().getUrl();
        }

        int postCount = postRepository.countByOwnerIdAndStatusTrue(targetUser.getId());

        // Nếu không có quyền truy cập, trả về thông tin hạn chế
        if (!hasAccess) {
            return new UserProfileDto(
                    targetUser.getId(),
                    targetUser.getUsername(),
                    targetUser.getDisplayName(),
                    null, // email
                    null, // bio
                    null, // gender
                    null, // dateOfBirth
                    0,    // followerCount
                    0,    // followeeCount
                    profileImageUrl,
                    0     // hoặc postCount nếu muốn công khai số bài viết
            );
        }

        // Nếu có quyền, trả về đầy đủ thông tin
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
                postCount
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
        int postCount = postRepository.countByOwnerIdAndStatusTrue(user.getId());

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
                postCount
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