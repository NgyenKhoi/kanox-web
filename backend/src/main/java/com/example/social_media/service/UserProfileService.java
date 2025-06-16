package com.example.social_media.service;

import com.example.social_media.dto.media.MediaDto;
import com.example.social_media.dto.user.UserProfileDto;
import com.example.social_media.dto.user.UserTagDto;
import com.example.social_media.dto.user.UserUpdateProfileDto;
import com.example.social_media.entity.*;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.ContentPrivacyRepository;
import com.example.social_media.repository.CustomPrivacyListRepository;
import com.example.social_media.repository.FollowRepository;
import com.example.social_media.repository.TargetTypeRepository;
import com.example.social_media.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final MediaService mediaService;
    private final GcsService gcsService;
    private final ContentPrivacyRepository contentPrivacyRepository;
    private final CustomPrivacyListRepository customPrivacyListRepository;
    private final TargetTypeRepository targetTypeRepository;

    public UserProfileService(
            UserRepository userRepository,
            FollowRepository followRepository,
            MediaService mediaService,
            GcsService gcsService,
            ContentPrivacyRepository contentPrivacyRepository,
            CustomPrivacyListRepository customPrivacyListRepository,
            TargetTypeRepository targetTypeRepository
    ) {
        this.userRepository = userRepository;
        this.followRepository = followRepository;
        this.mediaService = mediaService;
        this.gcsService = gcsService;
        this.contentPrivacyRepository = contentPrivacyRepository;
        this.customPrivacyListRepository = customPrivacyListRepository;
        this.targetTypeRepository = targetTypeRepository;
    }

    public UserProfileDto getUserProfile(String username, Integer id) {
        User user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int followerCount = followRepository.countByFolloweeAndStatusTrue(user);
        int followeeCount = followRepository.countByFollowerAndStatusTrue(user);

        String profileImageUrl = null;
        List<MediaDto> profileMedia = mediaService.getMediaByTargetDto(user.getId(), "PROFILE", "image", true);
        if (!profileMedia.isEmpty()) {
            profileImageUrl = profileMedia.getFirst().getUrl();
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
    public UserProfileDto updateUserProfile(String username, UserUpdateProfileDto updateDto, MultipartFile avatarFile) throws IOException {
        User user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

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
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        return new UserTagDto(user);
    }

    @Transactional
    public void updateProfilePrivacy(Integer userId, String privacySetting, Integer customListId) {
        User user = userRepository.findByIdAndStatusTrue(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        if (!List.of("public", "friends", "only_me", "custom").contains(privacySetting)) {
            throw new IllegalArgumentException("Invalid privacy setting: " + privacySetting);
        }

        user.setProfilePrivacySetting(privacySetting);
        userRepository.save(user);

        ContentPrivacy contentPrivacy = contentPrivacyRepository.findByContentIdAndContentTypeIdAndStatusTrue(userId, 4)
                .orElseGet(() -> {
                    ContentPrivacy newPrivacy = new ContentPrivacy();
                    ContentPrivacyId id = new ContentPrivacyId();
                    id.setContentId(userId);
                    id.setContentTypeId(4); // PROFILE
                    newPrivacy.setId(id);
                    TargetType targetType = targetTypeRepository.findById(4)
                            .orElseThrow(() -> new IllegalArgumentException("TargetType with id 4 not found"));
                    newPrivacy.setContentType(targetType);
                    newPrivacy.setStatus(true);
                    return newPrivacy;
                });

        contentPrivacy.setPrivacySetting(privacySetting);
        if (customListId != null && "custom".equals(privacySetting)) {
            CustomPrivacyList customList = customPrivacyListRepository.findByIdAndStatusTrue(customListId)
                    .orElseThrow(() -> new IllegalArgumentException("Custom list not found: " + customListId));
            contentPrivacy.setCustomList(customList);
        } else {
            contentPrivacy.setCustomList(null);
        }

        contentPrivacy.setUpdatedAt(Instant.now());
        contentPrivacyRepository.save(contentPrivacy);
    }
}