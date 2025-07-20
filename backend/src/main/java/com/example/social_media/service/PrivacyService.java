package com.example.social_media.service;

import com.example.social_media.dto.privacy.CustomListMemberDto;
import com.example.social_media.dto.privacy.ProfilePrivacySettingDto;
import com.example.social_media.entity.*;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
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

        // ✅ Nếu là PROFILE → xử lý riêng
        if (targetTypeCode.equals("PROFILE")) {
            if (Objects.equals(viewerId, contentId)) {
                logger.debug("Viewer is profile owner, granting access");
                return true;
            }

            User viewer = userRepository.findById(viewerId)
                    .orElseThrow(() -> new UserNotFoundException("Viewer not found with id: " + viewerId));
            User owner = userRepository.findById(contentId)
                    .orElseThrow(() -> new UserNotFoundException("Owner not found with id: " + contentId));

            PrivacySetting setting = privacySettingRepository.findById(owner.getId())
                    .orElse(null);
            String privacySetting = (setting != null && setting.getProfileViewer() != null)
                    ? setting.getProfileViewer()
                    : "public";

            switch (privacySetting) {
                case "public":
                    return true;
                case "friends":
                    boolean isFriend = friendshipRepository.findByUserIdAndFriendIdAndFriendshipStatusAndStatus(
                            viewer.getId(), owner.getId(), "accepted", true).isPresent()
                            || friendshipRepository.findByUserIdAndFriendIdAndFriendshipStatusAndStatus(
                            owner.getId(), viewer.getId(), "accepted", true).isPresent();
                    return isFriend;
                case "only_me":
                    return false;
                default:
                    return true;
            }
        }

        ContentPrivacy contentPrivacy = contentPrivacyRepository.findByContentIdAndContentTypeId(contentId, targetType.getId())
                .orElse(null);

        String privacySetting = contentPrivacy != null ? contentPrivacy.getPrivacySetting() : null;

        Integer ownerId = contentPrivacyRepository.findOwnerIdByContentId(contentId)
                .orElse(null);

        if (ownerId == null) {
            logger.warn("Owner not found for contentId: {}", contentId);
            return false;
        }

        if (Objects.equals(viewerId, ownerId)) {
            logger.debug("Viewer is owner, granting access");
            return true;
        }

        User viewer = userRepository.findById(viewerId)
                .orElseThrow(() -> new UserNotFoundException("Viewer not found with id: " + viewerId));
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UserNotFoundException("Owner not found with id: " + ownerId));

        if (privacySetting == null) {
            PrivacySetting privacySettingEntity = privacySettingRepository.findById(owner.getId())
                    .orElse(null);
            privacySetting = privacySettingEntity != null ? privacySettingEntity.getPostViewer() : "public";
            logger.debug("No content-specific privacy found, falling back to global setting: {}", privacySetting);
        } else {
            logger.debug("Content-specific privacy found: {}", privacySetting);
        }

        switch (privacySetting) {
            case "public":
                return true;
            case "friends":
                boolean isFriend = friendshipRepository.findByUserIdAndFriendIdAndFriendshipStatusAndStatus(
                        viewer.getId(), owner.getId(), "accepted", true).isPresent() ||
                        friendshipRepository.findByUserIdAndFriendIdAndFriendshipStatusAndStatus(
                                owner.getId(), viewer.getId(), "accepted", true).isPresent();
                return isFriend;
            case "custom":
                if (contentPrivacy != null && contentPrivacy.getCustomList() != null) {
                    boolean isInCustomList = customPrivacyListMemberRepository
                            .findByListIdAndMemberUser(contentPrivacy.getCustomList().getId(), viewer)
                            .isPresent();
                    return isInCustomList;
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

    public Integer getContentOwnerId(Integer contentId) {
        return contentPrivacyRepository.findOwnerIdByContentId(contentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chủ sở hữu nội dung"));
    }

    public Map<Integer, Boolean> checkContentAccessBatch(Integer viewerId, List<Integer> contentIds, String targetTypeCode) {
        logger.debug("Kiểm tra quyền truy cập hàng loạt cho viewerId: {}, contentIds: {}, targetTypeCode: {}", viewerId, contentIds, targetTypeCode);

        // Lấy TargetType
        TargetType targetType = targetTypeRepository.findByCode(targetTypeCode)
                .orElseThrow(() -> new IllegalArgumentException("Loại mục tiêu không hợp lệ: " + targetTypeCode));

        // Lấy thông tin viewer
        User viewer = userRepository.findById(viewerId)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người xem với id: " + viewerId));

        // Lấy danh sách ContentPrivacy cho các contentIds
        List<ContentPrivacy> contentPrivacies = contentPrivacyRepository.findByContentIdsAndContentTypeId(contentIds, targetType.getId());
        Map<Integer, ContentPrivacy> contentPrivacyMap = contentPrivacies.stream()
                .collect(Collectors.toMap(cp -> cp.getId().getContentId(), cp -> cp));

        // Lấy danh sách ownerId cho các contentIds
        List<Object[]> ownerResults = contentPrivacyRepository.findOwnerIdsByContentIds(contentIds);
        Map<Integer, Integer> contentOwnerMap = ownerResults.stream()
                .collect(Collectors.toMap(
                        result -> (Integer) result[0], // contentId
                        result -> (Integer) result[1]  // ownerId
                ));

        // Lấy danh sách ID bạn bè của viewer
        List<Integer> friendIds = friendshipRepository.findBidirectionalFriendIdsByUserIdAndStatus(viewerId, "accepted");

        // Lấy cài đặt quyền riêng tư cho tất cả owner
        List<Integer> ownerIds = new ArrayList<>(new HashSet<>(contentOwnerMap.values()));
        List<PrivacySetting> ownerPrivacySettings = ownerIds.isEmpty() ?
                List.of() :
                privacySettingRepository.findByUserIdIn(ownerIds);
        Map<Integer, String> ownerPrivacyMap = ownerPrivacySettings.stream()
                .collect(Collectors.toMap(
                        ps -> ps.getId(),
                        ps -> Optional.ofNullable(ps.getPostViewer()).orElse("public"),
                        (p1, p2) -> p1
                ));

        // Lấy danh sách thành viên danh sách tùy chỉnh
        List<Integer> customListIds = contentPrivacies.stream()
                .filter(cp -> cp.getCustomList() != null)
                .map(cp -> cp.getCustomList().getId())
                .distinct()
                .collect(Collectors.toList());
        List<CustomPrivacyListMember> customListMembers = customListIds.isEmpty() ?
                List.of() :
                customPrivacyListMemberRepository.findByListIdsAndMemberUserIdAndStatus(customListIds, viewerId);
        Set<Integer> accessibleCustomListIds = customListMembers.stream()
                .map(m -> m.getList().getId())
                .collect(Collectors.toSet());

        Map<Integer, Boolean> accessMap = new HashMap<>();
        for (Integer contentId : contentIds) {
            if (!contentOwnerMap.containsKey(contentId)) {
                accessMap.put(contentId, true);
                continue;
            }

            Integer ownerId = contentOwnerMap.get(contentId);
            if (Objects.equals(viewerId, ownerId)) {
                accessMap.put(contentId, true);
                continue;
            }

            ContentPrivacy contentPrivacy = contentPrivacyMap.get(contentId);
            String privacySetting = contentPrivacy != null ? contentPrivacy.getPrivacySetting() : null;

            if (privacySetting == null) {
                privacySetting = ownerPrivacyMap.getOrDefault(ownerId, "public");
            }
            switch (privacySetting) {
                case "public":
                    accessMap.put(contentId, true);
                    break;
                case "friends":
                    accessMap.put(contentId, friendIds.contains(ownerId));
                    break;
                case "custom":
                    boolean isInCustomList = contentPrivacy != null && contentPrivacy.getCustomList() != null &&
                            accessibleCustomListIds.contains(contentPrivacy.getCustomList().getId());
                    accessMap.put(contentId, isInCustomList);
                    break;
                case "only_me":
                    accessMap.put(contentId, false);
                    break;
                default:
                    accessMap.put(contentId, true);
            }
        }
        return accessMap;
    }

    public ProfilePrivacySettingDto getProfilePrivacySetting(Integer userId) {
        PrivacySetting setting = privacySettingRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cài đặt quyền riêng tư cho userId = " + userId));

        return new ProfilePrivacySettingDto(
                setting.getProfileViewer()
        );
    }

}
