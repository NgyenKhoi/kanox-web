package com.example.social_media.service;

import com.example.social_media.entity.*;
import com.example.social_media.exception.RegistrationException;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Objects;

@Service
public class PrivacyService {
    private final PrivacySettingRepository privacySettingRepository;
    private final ContentPrivacyRepository contentPrivacyRepository;
    private final CustomPrivacyListMemberRepository customPrivacyListMemberRepository;
    private final FriendshipRepository friendshipRepository;
    private final TargetTypeRepository targetTypeRepository;
    private final UserRepository userRepository;
    private final CustomPrivacyListRepository customPrivacyListRepository;

    public PrivacyService(
            PrivacySettingRepository privacySettingRepository,
            ContentPrivacyRepository contentPrivacyRepository,
            CustomPrivacyListMemberRepository customPrivacyListMemberRepository,
            FriendshipRepository friendshipRepository,
            TargetTypeRepository targetTypeRepository,
            UserRepository userRepository,
            CustomPrivacyListRepository customPrivacyListRepository
    ) {
        this.privacySettingRepository = privacySettingRepository;
        this.contentPrivacyRepository = contentPrivacyRepository;
        this.customPrivacyListMemberRepository = customPrivacyListMemberRepository;
        this.friendshipRepository = friendshipRepository;
        this.targetTypeRepository = targetTypeRepository;
        this.userRepository = userRepository;
        this.customPrivacyListRepository = customPrivacyListRepository;
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
    @Transactional
    public Integer createCustomList(Integer userId, String listName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        CustomPrivacyList customList = new CustomPrivacyList();
        customList.setId(userId);
        customList.setListName(listName);
        customList.setCreatedAt(Instant.now());
        customList.setStatus(true);
        CustomPrivacyList savedList = customPrivacyListRepository.save(customList);
        return savedList.getId();
    }

    @Transactional
    public void addMemberToCustomList(Integer userId, CustomPrivacyListMemberId listId, User memberId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        CustomPrivacyList customList = customPrivacyListRepository.findById(listId.getListId())
                .orElseThrow(() -> new IllegalArgumentException("Custom list not found"));
        if (!customList.getId().equals(user.getId())) {
            throw new IllegalArgumentException("User not authorized to modify this list");
        }
        User member = userRepository.findById(memberId.getId())
                .orElseThrow(() -> new UserNotFoundException("Member not found with id: " + memberId));
        if (memberId.equals(userId)) {
            throw new IllegalArgumentException("Cannot add yourself to custom list");
        }
        // Kiểm tra xem thành viên đã có trong danh sách chưa
        if (customPrivacyListMemberRepository.findByListAndMemberUser(listId, memberId).isPresent()) {
            throw new IllegalArgumentException("User is already a member of this list");
        }
        CustomPrivacyListMember listMember = new CustomPrivacyListMember();
        listMember.setId(listId);
        listMember.setMemberUser(memberId);
        listMember.setAddedAt(Instant.now());
        listMember.setStatus(true);
        customPrivacyListMemberRepository.save(listMember);
    }
}