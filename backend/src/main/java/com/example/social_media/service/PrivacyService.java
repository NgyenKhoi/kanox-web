package com.example.social_media.service;

import com.example.social_media.entity.*;
import com.example.social_media.exception.RegistrationException;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.*;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
public class PrivacyService {
    private final PrivacySettingRepository privacySettingRepository;
    private final ContentPrivacyRepository contentPrivacyRepository;
    private final CustomPrivacyListMemberRepository customPrivacyListMemberRepository;
    private final FriendshipRepository friendshipRepository;
    private final TargetTypeRepository targetTypeRepository;
    private final UserRepository userRepository;

    public PrivacyService(
            PrivacySettingRepository privacySettingRepository,
            ContentPrivacyRepository contentPrivacyRepository,
            CustomPrivacyListMemberRepository customPrivacyListMemberRepository,
            FriendshipRepository friendshipRepository,
            TargetTypeRepository targetTypeRepository,
            UserRepository userRepository
    ) {
        this.privacySettingRepository = privacySettingRepository;
        this.contentPrivacyRepository = contentPrivacyRepository;
        this.customPrivacyListMemberRepository = customPrivacyListMemberRepository;
        this.friendshipRepository = friendshipRepository;
        this.targetTypeRepository = targetTypeRepository;
        this.userRepository = userRepository;
    }

    public boolean checkContentAccess(Integer viewerId, Integer ownerId, String targetTypeCode) {
        if (Objects.equals(viewerId, ownerId)) {
            return true; // Owner always has access
        }

        TargetType targetType = targetTypeRepository.findByCode(targetTypeCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid target type: " + targetTypeCode));

        User viewer = userRepository.findById(viewerId)
                .orElseThrow(() -> new UserNotFoundException("Viewer not found with id: " + viewerId));
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UserNotFoundException("Owner not found with id: " + ownerId));

        // Check content-specific privacy
        ContentPrivacy contentPrivacy = contentPrivacyRepository.findByContentIdAndContentTypeId(ownerId, targetType.getId())
                .orElse(null);

        String privacySetting = contentPrivacy != null ? contentPrivacy.getPrivacySetting() : null;

        if (privacySetting == null) {
            // Fall back to global privacy settings
            PrivacySetting privacySettingEntity = privacySettingRepository.findByTblUserId(ownerId)
                    .orElse(null);
            privacySetting = privacySettingEntity != null ? privacySettingEntity.getProfileViewer() : "public";
        }

        switch (privacySetting) {
            case "public":
                return true;
            case "friends":
                return friendshipRepository.findByUserAndFriendAndStatus(viewer, owner, true)
                        .filter(f -> "accepted".equals(f.getFriendshipStatus()))
                        .isPresent() ||
                        friendshipRepository.findByUserAndFriendAndStatus(owner, viewer, true)
                                .filter(f -> "accepted".equals(f.getFriendshipStatus()))
                                .isPresent();
            case "custom":
                if (contentPrivacy != null && contentPrivacy.getCustomList() != null) {
                    return customPrivacyListMemberRepository
                            .findByListIdAndMemberUser(contentPrivacy.getCustomList().getId(), viewer)
                            .isPresent();
                }
                return false;
            case "only_me":
                return false;
            default:
                return true;
        }
    }
}