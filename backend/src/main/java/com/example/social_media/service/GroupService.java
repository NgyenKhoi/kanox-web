package com.example.social_media.service;

import com.example.social_media.dto.group.GroupDisplayDto;
import com.example.social_media.dto.group.GroupSimpleDto;
import com.example.social_media.dto.group.GroupSummaryDto;
import com.example.social_media.dto.user.UserBasicDisplayDto;
import com.example.social_media.entity.Group;
import com.example.social_media.entity.GroupMember;
import com.example.social_media.entity.GroupMemberId;
import com.example.social_media.entity.User;
import com.example.social_media.exception.NotFoundException;
import com.example.social_media.exception.UnauthorizedException;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.GroupMemberRepository;
import com.example.social_media.repository.GroupRepository;
import com.example.social_media.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.web.multipart.MultipartFile;

@Service
public class GroupService {
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final MediaService mediaService;
    private final NotificationService notificationService;
    private final DataSyncService dataSyncService;

    public GroupService(GroupRepository groupRepository,
                        GroupMemberRepository groupMemberRepository,
                        UserRepository userRepository,
                        MediaService mediaService,
                        NotificationService notificationService,
                        DataSyncService dataSyncService) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userRepository = userRepository;
        this.mediaService = mediaService;
        this.notificationService = notificationService;
        this.dataSyncService = dataSyncService;
    }

    @Transactional
    public Group createGroup(String ownerUsername, String name, String description, String privacyLevel, MultipartFile avatarFile) throws IOException {
        User owner = userRepository.findByUsernameAndStatusTrue(ownerUsername)
                .orElseThrow(() -> new UserNotFoundException("Chủ sở hữu không tồn tại"));

        Group group = new Group();
        group.setOwner(owner);
        group.setName(name);
        group.setDescription(description);
        group.setPrivacyLevel(privacyLevel);
        group.setCreatedAt(Instant.now());
        group.setStatus(true);
        group = groupRepository.save(group);
        dataSyncService.syncGroupToElasticsearch(group.getId());

        GroupMemberId id = new GroupMemberId(group.getId(), owner.getId());

        GroupMember member = new GroupMember();
        member.setId(id);
        member.setGroup(group);
        member.setUser(owner);
        member.setJoinAt(Instant.now());
        member.setIsAdmin(true);
        member.setStatus(true);
        member.setInviteStatus("ACCEPTED");

        groupMemberRepository.save(member);

        if (avatarFile != null && !avatarFile.isEmpty()) {
            mediaService.uploadMedia(
                    owner.getId(),
                    group.getId(),
                    "GROUP",
                    "image",
                    avatarFile,
                    "avatar"
            );
        }

        return group;
    }

    @Transactional
    public Group updateGroup(Integer groupId, String ownerUsername, String name, String description, String privacyLevel, MultipartFile newAvatarFile) throws IOException {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new NotFoundException("Nhóm không tồn tại"));

        if (!group.getOwner().getUsername().equals(ownerUsername)) {
            throw new UnauthorizedException("Chỉ chủ sở hữu mới được sửa thông tin nhóm");
        }

        group.setName(name);
        group.setDescription(description);
        group.setPrivacyLevel(privacyLevel);
        groupRepository.save(group);

        if (newAvatarFile != null && !newAvatarFile.isEmpty()) {
            mediaService.disableOldGroupMedia(group.getId());
            mediaService.uploadMedia(
                    group.getOwner().getId(),
                    group.getId(),
                    "GROUP",
                    "image",
                    newAvatarFile,
                    "avatar"
            );
        }

        return group;
    }


    @Transactional
    public void deleteGroup(Integer groupId, String username) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group không tồn tại"));

        if (!group.getOwner().getUsername().equals(username)) {
            throw new UnauthorizedException("Chỉ chủ sở hữu mới được xóa group");
        }

        group.setStatus(false);
        groupRepository.save(group);

        groupMemberRepository.deactivateByGroupId(groupId);
    }

    @Transactional
    public void addMember(Integer groupId, String username) {
        Group group = groupRepository.findByIdAndStatusTrue(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group không tồn tại"));

        User user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("User không tồn tại"));

        GroupMemberId id = new GroupMemberId();
        id.setGroupId(groupId);
        id.setUserId(user.getId());

        if (groupMemberRepository.existsById(id)) {
            throw new IllegalArgumentException("User đã là thành viên");
        }

        GroupMember member = new GroupMember();
        member.setId(id);
        member.setGroup(group);
        member.setUser(user);
        member.setJoinAt(Instant.now());
        member.setIsAdmin(false);
        member.setStatus(true);

        groupMemberRepository.save(member);
    }

    @Transactional
    public void removeMember(Integer groupId, Integer targetUserId, String requesterUsername) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group không tồn tại"));

        User requester = userRepository.findByUsernameAndStatusTrue(requesterUsername)
                .orElseThrow(() -> new UserNotFoundException("Người gửi yêu cầu không tồn tại"));

        boolean isAdmin = groupMemberRepository.isGroupAdmin(groupId, requester.getId());
        if (!group.getOwner().getId().equals(requester.getId()) && !isAdmin) {
            throw new UnauthorizedException("Chỉ admin hoặc owner được xóa thành viên");
        }

        GroupMember member = groupMemberRepository.findById_GroupIdAndId_UserId(groupId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Thành viên không tồn tại"));

        member.setStatus(false);
        groupMemberRepository.save(member);
    }

    @Transactional
    public void assignAdmin(Integer groupId, Integer targetUserId, String requesterUsername) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group không tồn tại"));

        User requester = userRepository.findByUsernameAndStatusTrue(requesterUsername)
                .orElseThrow(() -> new UserNotFoundException("Người gửi không tồn tại"));

        if (!group.getOwner().getId().equals(requester.getId())) {
            throw new UnauthorizedException("Chỉ owner mới được gán quyền admin");
        }

        GroupMember member = groupMemberRepository.findById_GroupIdAndId_UserId(groupId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Thành viên không tồn tại"));

        member.setIsAdmin(true);
        groupMemberRepository.save(member);
    }

    public Map<String, Object> getGroupMembers(Integer groupId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("username"));
        Page<GroupMember> members = groupMemberRepository.findAcceptedMembersByGroupId(groupId, pageable);

        List<UserBasicDisplayDto> memberDtos = members
                .map(m -> {
                    User user = m.getUser();
                    return new UserBasicDisplayDto(
                            user.getId(),
                            mediaService.getAvatarUrlByUserId(user.getId()),
                            user.getDisplayName(),
                            user.getUsername()
                    );
                })
                .getContent();

        Map<String, Object> response = new HashMap<>();
        response.put("content", memberDtos);
        response.put("currentPage", members.getNumber());
        response.put("totalPages", members.getTotalPages());
        response.put("totalElements", members.getTotalElements());
        return response;
    }

    @Transactional
    public void inviteMember(Integer groupId, String usernameToInvite) {
        Group group = groupRepository.findByIdAndStatusTrue(groupId)
                .orElseThrow(() -> new NotFoundException("Group not found"));

        User userToInvite = userRepository.findByUsernameAndStatusTrue(usernameToInvite)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        GroupMemberId id = new GroupMemberId(groupId, userToInvite.getId());
        if (groupMemberRepository.existsById(id)) {
            throw new IllegalArgumentException("User is already invited or in group");
        }

        GroupMember member = new GroupMember();
        member.setId(id);
        member.setGroup(group);
        member.setUser(userToInvite);
        member.setIsAdmin(false);
        member.setStatus(true);
        member.setInviteStatus("PENDING");
        member.setJoinAt(Instant.now());
        groupMemberRepository.save(member);

        // Send group invite notification
        notificationService.sendNotification(
                userToInvite.getId(),
                "GROUP_INVITE",
                "{displayName} đã mời bạn vào một nhóm",
                group.getId(),
                "GROUP"
        );
    }

    @Transactional
    public void acceptInvite(Integer groupId, String username) {
        User user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        GroupMemberId id = new GroupMemberId(groupId, user.getId());
        GroupMember member = groupMemberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invite not found"));

        String currentStatus = member.getInviteStatus();

        if ("ACCEPTED".equals(currentStatus)) {
            throw new IllegalStateException("Bạn đã là thành viên của nhóm này.");
        }

        if ("REJECTED".equals(currentStatus)) {
            throw new IllegalStateException("Lời mời đã bị từ chối.");
        }

        if ("REQUESTED".equals(currentStatus)) {
            throw new IllegalStateException("Bạn đã gửi yêu cầu tham gia, vui lòng chờ duyệt.");
        }

        if (!"PENDING".equals(currentStatus)) {
            throw new IllegalStateException("Trạng thái lời mời không hợp lệ.");
        }

        // ✅ Chuyển từ PENDING → REQUESTED
        member.setInviteStatus("REQUESTED");
        member.setJoinAt(Instant.now());
        groupMemberRepository.save(member);

        // ✅ Gửi thông báo tới admin/owner
        Group group = member.getGroup();
        notificationService.sendNotification(
                group.getOwner().getId(),
                "GROUP_JOIN_REQUEST",
                user.getDisplayName() + " đã chấp nhận lời mời và đang chờ phê duyệt",
                group.getId(),
                "GROUP"
        );
    }

    @Transactional
    public void rejectInvite(Integer groupId, String username) {
        User user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        GroupMember member = groupMemberRepository.findById(new GroupMemberId(groupId, user.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Invite not found"));

        if (!"PENDING".equals(member.getInviteStatus())) {
            throw new IllegalStateException("Invite already handled");
        }

        member.setInviteStatus("REJECTED");
        groupMemberRepository.save(member);
    }

    public List<GroupSimpleDto> getPendingInviteSummaries(String username) {
        User user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        List<Group> groups = groupMemberRepository.findGroupsByUserIdAndInviteStatus(user.getId(), "PENDING");

        return groups.stream()
                .map(group -> new GroupSimpleDto(
                        group.getId(),
                        group.getName(),
                        mediaService.getGroupAvatarUrl(group.getId())
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public void requestToJoinGroup(Integer groupId, String username) {
        Group group = groupRepository.findByIdAndStatusTrue(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group không tồn tại"));

        User user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("Người dùng không tồn tại"));

        GroupMemberId id = new GroupMemberId(groupId, user.getId());

        if (groupMemberRepository.existsById(id)) {
            throw new IllegalArgumentException("Bạn đã yêu cầu hoặc đã tham gia nhóm này");
        }

        GroupMember request = new GroupMember();
        request.setId(id);
        request.setGroup(group);
        request.setUser(user);
        request.setJoinAt(Instant.now());
        request.setIsAdmin(false);
        request.setStatus(true);
        request.setInviteStatus("REQUESTED");

        groupMemberRepository.save(request);
    }

    @Transactional
    public void approveJoinRequest(Integer groupId, Integer userId, String adminUsername) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group không tồn tại"));

        User admin = userRepository.findByUsernameAndStatusTrue(adminUsername)
                .orElseThrow(() -> new UserNotFoundException("Người gửi yêu cầu không tồn tại"));

        boolean isAdmin = groupMemberRepository.isGroupAdmin(groupId, admin.getId());
        if (!group.getOwner().getId().equals(admin.getId()) && !isAdmin) {
            throw new UnauthorizedException("Chỉ admin hoặc chủ nhóm mới có thể duyệt yêu cầu");
        }

        GroupMember member = groupMemberRepository.findById(new GroupMemberId(groupId, userId))
                .orElseThrow(() -> new IllegalArgumentException("Yêu cầu tham gia không tồn tại"));

        if (!"REQUESTED".equals(member.getInviteStatus())) {
            throw new IllegalArgumentException("Yêu cầu đã được xử lý hoặc không hợp lệ");
        }

        member.setInviteStatus("ACCEPTED");
        member.setJoinAt(Instant.now());
        groupMemberRepository.save(member);
    }

    @Transactional
    public void rejectJoinRequest(Integer groupId, Integer userId, String adminUsername) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group không tồn tại"));

        User admin = userRepository.findByUsernameAndStatusTrue(adminUsername)
                .orElseThrow(() -> new UserNotFoundException("Người gửi không tồn tại"));

        boolean isAdmin = groupMemberRepository.isGroupAdmin(groupId, admin.getId());
        if (!group.getOwner().getId().equals(admin.getId()) && !isAdmin) {
            throw new UnauthorizedException("Chỉ admin hoặc chủ nhóm mới có thể từ chối yêu cầu");
        }

        GroupMember member = groupMemberRepository.findById(new GroupMemberId(groupId, userId))
                .orElseThrow(() -> new IllegalArgumentException("Yêu cầu tham gia không tồn tại"));

        if (!"REQUESTED".equals(member.getInviteStatus())) {
            throw new IllegalArgumentException("Yêu cầu đã được xử lý hoặc không hợp lệ");
        }

        member.setInviteStatus("REJECTED");
        groupMemberRepository.save(member);
    }

    public List<UserBasicDisplayDto> getJoinRequestsForGroup(Integer groupId, String adminUsername) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group không tồn tại"));

        User admin = userRepository.findByUsernameAndStatusTrue(adminUsername)
                .orElseThrow(() -> new UserNotFoundException("Người gọi không tồn tại"));

        boolean isAdmin = groupMemberRepository.isGroupAdmin(groupId, admin.getId());
        if (!group.getOwner().getId().equals(admin.getId()) && !isAdmin) {
            throw new UnauthorizedException("Chỉ admin hoặc chủ nhóm mới được xem yêu cầu tham gia");
        }

        return groupMemberRepository.findById_GroupIdAndInviteStatus(groupId, "REQUESTED").stream()
                .map(member -> {
                    User user = member.getUser();
                    return new UserBasicDisplayDto(
                            user.getId(),
                            mediaService.getAvatarUrlByUserId(user.getId()),
                            user.getDisplayName(),
                            user.getUsername()
                    );
                })
                .collect(Collectors.toList());
    }

    public GroupDisplayDto getGroupDetail(Integer groupId, String viewerUsername) {
        Group group = groupRepository.findByIdAndStatusTrue(groupId)
                .orElseThrow(() -> new NotFoundException("Group không tồn tại"));

        User viewer = userRepository.findByUsernameAndStatusTrue(viewerUsername)
                .orElseThrow(() -> new UserNotFoundException("Người dùng không tồn tại"));

        int memberCount = groupMemberRepository.findById_GroupIdAndStatusTrue(groupId).size();

        boolean isAdmin = groupMemberRepository.isGroupAdmin(groupId, viewer.getId()) != null
                && groupMemberRepository.isGroupAdmin(groupId, viewer.getId());

        boolean isOwner = group.getOwner().getId().equals(viewer.getId());
        String inviteStatus = groupMemberRepository.findById(new GroupMemberId(groupId, viewer.getId()))
                .map(GroupMember::getInviteStatus)
                .orElse(null);

        return new GroupDisplayDto(
                group.getId(),
                group.getName(),
                mediaService.getGroupAvatarUrl(group.getId()),
                group.getDescription(),
                group.getCreatedAt().toString(),
                memberCount,
                group.getOwner().getUsername(),
                group.getOwner().getDisplayName(),
                mediaService.getAvatarUrlByUserId(group.getOwner().getId()),
                isAdmin,
                isOwner,
                group.getPrivacyLevel(),
                inviteStatus
        );
    }

    public List<GroupDisplayDto> getGroupsOfUser(String username) {
        User user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("Người dùng không tồn tại"));

        List<GroupMember> memberships = groupMemberRepository
                .findByUserIdAndStatusTrueAndInviteStatusAccepted(user.getId());

        return memberships.stream()
                .map(member -> {
                    Group group = member.getGroup();
                    return new GroupDisplayDto(
                            group.getId(),
                            group.getName(),
                            mediaService.getGroupAvatarUrl(group.getId()),
                            group.getDescription(),
                            group.getCreatedAt().toString(),
                            groupMemberRepository.countByGroupIdAndStatusTrue(group.getId()),
                            group.getOwner().getUsername(),
                            group.getOwner().getDisplayName(),
                            mediaService.getAvatarUrlByUserId(group.getOwner().getId()),
                            member.getIsAdmin() != null && member.getIsAdmin(),
                            group.getOwner().getId().equals(user.getId()),
                            group.getPrivacyLevel(),
                            member.getInviteStatus()
                    );
                })
                .collect(Collectors.toList());
    }




   // ✅ Hàm chuyển đổi Entity → DTO đơn giản
    private GroupSimpleDto mapToSimpleDto(Group group) {
        return new GroupSimpleDto(
                group.getId(),
                group.getName(),
                null
        );
    }

    // ✅ Hàm trả danh sách GroupSimpleDto
    public List<GroupSimpleDto> getAllSimpleGroups() {
        return groupRepository.findAll()
                .stream()
                .map(this::mapToSimpleDto)
                .toList();
    }

    public Optional<Group> getGroupById(Integer id) {
        return groupRepository.findById(id);
    }

    public void deleteGroup(Integer id) {
        groupRepository.deleteById(id);
    }

    private GroupSummaryDto mapToSummaryDto(Group group) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd").withLocale(Locale.getDefault());

        int memberCount = (int) group.getTblGroupMembers().stream()
                .filter(GroupMember::getStatus)
                .count();

        String createdDate = group.getCreatedAt() != null
                ? formatter.format(group.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate())
                : null;

        return new GroupSummaryDto(
                group.getId(),
                group.getName(),
                memberCount,
                Boolean.TRUE.equals(group.getStatus()) ? "active" : "inactive",
                group.getPrivacyLevel(),
                createdDate
        );
    }

    public List<GroupSummaryDto> getAllGroupSummaries() {
        return groupRepository.findAll()
                .stream()
                .map(this::mapToSummaryDto)
                .toList();
    }


    @Transactional
    public void leaveGroup(Integer groupId, String username) {
        User user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("Người dùng không tồn tại"));

        GroupMember member = groupMemberRepository.findById(new GroupMemberId(groupId, user.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Bạn không phải là thành viên nhóm"));
        Group group = member.getGroup();
        if (group.getOwner().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Chủ nhóm không thể rời khỏi nhóm");
        }

        member.setStatus(false);
        groupMemberRepository.save(member);
    }

    public long countAllGroups() {
        return groupRepository.count();
    }

}
