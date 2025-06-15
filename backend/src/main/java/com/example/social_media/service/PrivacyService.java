package com.example.social_media.service;

import com.example.social_media.dto.privacy.CustomListMemberDto;
import com.example.social_media.entity.*;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class PrivacyService {
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
        userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng với id: " + userId));
        return customPrivacyListRepository.findAllByUserIdAndStatus(userId, true);
    }

    @Transactional
    public void deleteCustomList(Integer userId, Integer listId) {
        CustomPrivacyList customList = customPrivacyListRepository.findByIdAndUserIdAndStatus(listId, userId, true)
                .orElseThrow(() -> new IllegalArgumentException("Danh sách không tồn tại hoặc bạn không có quyền"));

        // Xóa mềm các thành viên trong danh sách
        List<CustomPrivacyListMember> members = customPrivacyListMemberRepository.findAllByListIdAndStatus(listId, true);
        members.forEach(member -> member.setStatus(false));
        customPrivacyListMemberRepository.saveAll(members);

        // Đặt lại privacy_setting và custom_list_id
        contentPrivacyRepository.updatePrivacySettingByCustomListId(listId);

        // Xóa mềm danh sách
        customList.setStatus(false);
        customPrivacyListRepository.save(customList);
    }

    @Transactional
    public List<CustomListMemberDto> getCustomListMembers(Integer userId, Integer listId) {
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