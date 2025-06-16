package com.example.social_media.service;

import com.example.social_media.dto.privacy.CustomListMemberDto;
import com.example.social_media.entity.*;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class PrivacyService {
    private static final Logger logger = LoggerFactory.getLogger(PrivacyService.class);

    private final CustomPrivacyListRepository customPrivacyListRepository;
    private final CustomPrivacyListMemberRepository customPrivacyListMemberRepository;
    private final UserRepository userRepository;
    private final ContentPrivacyRepository contentPrivacyRepository;
    private final TargetTypeRepository targetTypeRepository;
    private final PrivacySettingRepository privacySettingRepository;
    private final FriendshipRepository friendshipRepository;

    public PrivacyService(
            CustomPrivacyListRepository customPrivacyListRepository,
            CustomPrivacyListMemberRepository customPrivacyListMemberRepository,
            UserRepository userRepository,
            ContentPrivacyRepository contentPrivacyRepository,
            TargetTypeRepository targetTypeRepository,
            PrivacySettingRepository privacySettingRepository,
            FriendshipRepository friendshipRepository
    ) {
        this.customPrivacyListRepository = customPrivacyListRepository;
        this.customPrivacyListMemberRepository = customPrivacyListMemberRepository;
        this.userRepository = userRepository;
        this.contentPrivacyRepository = contentPrivacyRepository;
        this.targetTypeRepository = targetTypeRepository;
        this.privacySettingRepository = privacySettingRepository;
        this.friendshipRepository = friendshipRepository;
    }

    public PrivacySetting getPrivacySettingByUserId(Integer userId) {
        logger.debug("Fetching privacy settings for userId: {}", userId);
        return privacySettingRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy cài đặt quyền riêng tư cho người dùng với id: " + userId));
    }

    public void savePrivacySetting(PrivacySetting privacySetting) {
        logger.debug("Saving privacy settings: {}", privacySetting);
        privacySettingRepository.save(privacySetting);
    }

    public boolean checkContentAccess(Integer viewerId, Integer contentId, String targetTypeCode) {
        logger.debug("Checking access for viewerId: {}, contentId: {}, targetTypeCode: {}", viewerId, contentId, targetTypeCode);

        TargetType targetType = targetTypeRepository.findByCode(targetTypeCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid target type: " + targetTypeCode));

        // Find ContentPrivacy for the specific content
        ContentPrivacy contentPrivacy = contentPrivacyRepository.findByContentIdAndContentTypeId(contentId, targetType.getId())
                .orElse(null);

        String privacySetting = contentPrivacy != null ? contentPrivacy.getPrivacySetting() : null;

        // Get ownerId from tblPosts
        Integer ownerId = contentPrivacyRepository.findOwnerIdByContentId(contentId)
                .orElse(null);

        if (ownerId == null) {
            logger.warn("Owner not found for contentId: {}", contentId);
            return false;
        }

        if (Objects.equals(viewerId, ownerId)) {
            logger.debug("Viewer is owner, granting access");
            return true; // Owner always has access
        }

        User viewer = userRepository.findById(viewerId)
                .orElseThrow(() -> new UserNotFoundException("Viewer not found with id: " + viewerId));
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UserNotFoundException("Owner not found with id: " + ownerId));

        if (privacySetting == null) {
            // Fall back to global privacy settings
            PrivacySetting privacySettingEntity = privacySettingRepository.findById(owner.getId())
                    .orElse(null);
            privacySetting = privacySettingEntity != null ? privacySettingEntity.getPostViewer() : "public";
            logger.debug("No content-specific privacy found, falling back to global setting: {}", privacySetting);
        } else {
            logger.debug("Content-specific privacy found: {}", privacySetting);
        }

        switch (privacySetting) {
            case "public":
                logger.debug("Public setting, granting access");
                return true;
            case "friends":
                boolean isFriend = friendshipRepository.findByUserAndFriendAndStatus(viewer, owner, true)
                        .filter(f -> "accepted".equals(f.getFriendshipStatus()))
                        .isPresent() ||
                        friendshipRepository.findByUserAndFriendAndStatus(owner, viewer, true)
                                .filter(f -> "accepted".equals(f.getFriendshipStatus()))
                                .isPresent();
                logger.debug("Friends setting, isFriend: {}", isFriend);
                return isFriend;
            case "custom":
                if (contentPrivacy != null && contentPrivacy.getCustomList() != null) {
                    boolean isInCustomList = customPrivacyListMemberRepository
                            .findByListIdAndMemberUser(contentPrivacy.getCustomList().getId(), viewer)
                            .isPresent();
                    logger.debug("Custom setting, isInCustomList: {}", isInCustomList);
                    return isInCustomList;
                }
                logger.debug("Custom setting but no custom list, denying access");
                return false;
            case "only_me":
                logger.debug("Only_me setting, denying access");
                return false;
            default:
                logger.warn("Unknown privacy setting: {}, defaulting to public");
                return true;
        }
    }

    @Transactional
    public Integer createCustomList(Integer userId, String listName) {
        logger.debug("Creating custom list for userId: {}, listName: {}", userId, listName);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng với id: " + userId));
        if (listName == null || listName.trim().isEmpty()) {
            throw new IllegalArgumentException("Tên danh sách không được để trống");
        }
        if (customPrivacyListRepository.existsByUserIdAndListNameAndStatus(userId, listName, true)) {
            throw new IllegalArgumentException("Danh sách với tên này đã tồn tại");
        }
        CustomPrivacyList customList = new CustomPrivacyList();
        customList.setUser(user);
        customList.setListName(listName);
        customList.setCreatedAt(Instant.now());
        customList.setStatus(true);
        CustomPrivacyList savedList = customPrivacyListRepository.save(customList);
        return savedList.getId();
    }

    @Transactional
    public List<CustomPrivacyList> getCustomLists(Integer userId) {
        logger.debug("Fetching custom lists for userId: {}", userId);
        userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng với id: " + userId));
        return customPrivacyListRepository.findAllByUserIdAndStatus(userId, true);
    }

    @Transactional
    public void deleteCustomList(Integer userId, Integer listId) {
        logger.debug("Deleting custom list for userId: {}, listId: {}", userId, listId);
        CustomPrivacyList customList = customPrivacyListRepository.findByIdAndUserIdAndStatus(listId, userId, true)
                .orElseThrow(() -> new IllegalArgumentException("Danh sách không tồn tại hoặc bạn không có quyền"));

        List<CustomPrivacyListMember> members = customPrivacyListMemberRepository.findAllByListIdAndStatus(listId, true);
        members.forEach(member -> member.setStatus(false));
        customPrivacyListMemberRepository.saveAll(members);

        contentPrivacyRepository.updatePrivacySettingByCustomListId(listId);

        customList.setStatus(false);
        customPrivacyListRepository.save(customList);
    }

    @Transactional
    public List<CustomListMemberDto> getCustomListMembers(Integer userId, Integer listId) {
        logger.debug("Fetching custom list members for userId: {}, listId: {}", userId, listId);
        CustomPrivacyList customList = customPrivacyListRepository.findByIdAndUserIdAndStatus(listId, userId, true)
                .orElseThrow(() -> new IllegalArgumentException("Danh sách không tồn tại hoặc bạn không có quyền"));

        List<CustomPrivacyListMember> members = customPrivacyListMemberRepository.findAllByListIdAndStatus(listId, true);
        return members.stream()
                .map(member -> {
                    CustomListMemberDto dto = new CustomListMemberDto();
                    dto.setMemberUserId(member.getMemberUser().getId());
                    dto.setUsername(member.getMemberUser().getUsername());
                    dto.setDisplayName(member.getMemberUser().getDisplayName());
                    dto.setAddedAt(member.getAddedAt());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void addMemberToCustomList(Integer userId, Integer listId, Integer memberId) {
        logger.debug("Adding member to custom list for userId: {}, listId: {}, memberId: {}", userId, listId, memberId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng với id: " + userId));
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy thành viên với id: " + memberId));
        CustomPrivacyList customList = customPrivacyListRepository.findByIdAndUserIdAndStatus(listId, userId, true)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh sách tùy chỉnh hoặc bạn không có quyền"));

        if (memberId.equals(userId)) {
            throw new IllegalArgumentException("Không thể thêm chính bạn vào danh sách");
        }
        if (customPrivacyListMemberRepository.existsByListIdAndMemberUserIdAndStatus(listId, memberId, true)) {
            throw new IllegalArgumentException("Người dùng đã có trong danh sách này");
        }

        CustomPrivacyListMember listMember = new CustomPrivacyListMember();
        CustomPrivacyListMemberId id = new CustomPrivacyListMemberId();
        id.setListId(listId);
        id.setMemberUserId(memberId);
        listMember.setId(id);
        listMember.setList(customList);
        listMember.setMemberUser(member);
        listMember.setAddedAt(Instant.now());
        listMember.setStatus(true);
        customPrivacyListMemberRepository.save(listMember);
    }

    @Transactional
    public void removeMemberFromCustomList(Integer userId, Integer listId, Integer memberId) {
        logger.debug("Removing member from custom list for userId: {}, listId: {}, memberId: {}", userId, listId, memberId);
        CustomPrivacyList customList = customPrivacyListRepository.findByIdAndUserIdAndStatus(listId, userId, true)
                .orElseThrow(() -> new IllegalArgumentException("Danh sách không tồn tại hoặc bạn không có quyền"));

        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy thành viên với id: " + memberId));

        int updated = customPrivacyListMemberRepository.deleteByListIdAndMemberUserId(listId, memberId);
        if (updated == 0) {
            throw new IllegalArgumentException("Thành viên không có trong danh sách hoặc đã bị xóa");
        }
    }
}
