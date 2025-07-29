package com.example.social_media.service;

import com.example.social_media.dto.group.GroupDisplayDto;
import com.example.social_media.dto.group.GroupMemberDisplayDto;
import com.example.social_media.dto.group.GroupSimpleDto;
import com.example.social_media.dto.group.GroupSummaryDto;
import com.example.social_media.dto.user.UserBasicDisplayDto;
import com.example.social_media.entity.*;
        import com.example.social_media.exception.NotFoundException;
import com.example.social_media.exception.UnauthorizedException;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.FriendshipRepository;
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
    private final FriendshipRepository friendshipRepository;

    public GroupService(GroupRepository groupRepository,
                        GroupMemberRepository groupMemberRepository,
                        UserRepository userRepository,
                        MediaService mediaService,
                        NotificationService notificationService,
                        DataSyncService dataSyncService,
                        FriendshipRepository friendshipRepository) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userRepository = userRepository;
        this.mediaService = mediaService;
        this.notificationService = notificationService;
        this.dataSyncService = dataSyncService;
        this.friendshipRepository = friendshipRepository;
    }

    public boolean isMember(Integer groupId, String username) {
        return groupMemberRepository.existsByGroupIdAndUserUsername(groupId, username);
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
        member.setIsOwner(true);
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
    public void deleteGroupAsAdmin(Integer groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new NotFoundException("Group không tồn tại"));

        // Đánh dấu là đã xóa thay vì xóa hẳn
        group.setStatus(false);
        groupRepository.save(group);

        // Deactivate all group members
        groupMemberRepository.deactivateByGroupId(groupId);
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

        if (group.getOwner().getId().equals(targetUserId)) {
            throw new IllegalArgumentException("Không thể xóa chủ nhóm");
        }

        GroupMemberId id = new GroupMemberId(groupId, targetUserId);
        GroupMember member = groupMemberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Thành viên không tồn tại"));

        groupMemberRepository.delete(member); // ✅ Xóa hoàn toàn bản ghi

        notificationService.sendNotification(
                targetUserId,
                "GROUP_USER_KICKED",
                "Bạn đã bị Admin xóa khỏi nhóm",
                groupId,
                "GROUP"
        );
    }

    public boolean isGroupAdminOrOwner(Integer groupId, Integer userId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new NotFoundException("Nhóm không tồn tại"));
        return group.getOwner().getId().equals(userId) ||
                groupMemberRepository.isGroupAdmin(groupId, userId);
    }


    public Map<String, Object> getGroupMembers(Integer groupId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<GroupMember> members = groupMemberRepository.findAcceptedMembersByGroupId(groupId, pageable);

        List<GroupMemberDisplayDto> memberDtos = members
                .map(m -> {
                    User user = m.getUser();
                    return new GroupMemberDisplayDto(
                            user.getId(),
                            user.getDisplayName(),
                            user.getUsername(),
                            mediaService.getAvatarUrlByUserId(user.getId()),
                            Boolean.TRUE.equals(m.getIsAdmin()),
                            Boolean.TRUE.equals(m.getIsOwner())
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
    public void assignRole(Integer groupId, Integer targetUserId, String requesterUsername, String role) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new NotFoundException("Group không tồn tại"));

        User requester = userRepository.findByUsernameAndStatusTrue(requesterUsername)
                .orElseThrow(() -> new UserNotFoundException("Người gửi không tồn tại"));

        if (!group.getOwner().getId().equals(requester.getId())) {
            throw new UnauthorizedException("Chỉ chủ nhóm mới được gán vai trò");
        }

        GroupMember targetMember = groupMemberRepository.findById_GroupIdAndId_UserId(groupId, targetUserId)
                .orElseThrow(() -> new NotFoundException("Người dùng không phải thành viên nhóm"));

        GroupMemberId requesterId = new GroupMemberId(groupId, requester.getId());
        GroupMember requesterMember = groupMemberRepository.findById(requesterId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin người gọi"));

        switch (role.toUpperCase()) {
            case "ADMIN":
                targetMember.setIsAdmin(true);
                groupMemberRepository.save(targetMember);
                break;

            case "OWNER":
                if (targetUserId.equals(requester.getId())) {
                    throw new IllegalArgumentException("Bạn đang là chủ nhóm rồi");
                }

                requesterMember.setIsOwner(false);
                targetMember.setIsOwner(true);
                targetMember.setIsAdmin(true); // Chủ nhóm phải là admin

                group.setOwner(targetMember.getUser());

                groupMemberRepository.saveAll(List.of(requesterMember, targetMember));
                groupRepository.save(group);
                break;

            default:
                throw new IllegalArgumentException("Vai trò không hợp lệ. Chỉ chấp nhận ADMIN hoặc OWNER");
        }
    }

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

        notificationService.sendNotification(
                userToInvite.getId(),
                "GROUP_INVITE",
                group.getName() + " muốn mời bạn tham gia vào nhóm",
                group.getId(),
                "GROUP",
                mediaService.getGroupAvatarUrl(group.getId())
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

        member.setInviteStatus("REQUESTED");
        member.setJoinAt(Instant.now());
        groupMemberRepository.save(member);

        // Sửa: Thêm tham số image
        Group group = member.getGroup();
        notificationService.sendNotification(
                group.getOwner().getId(),
                "GROUP_JOIN_REQUEST",
                user.getDisplayName() + " đã chấp nhận lời mời và đang chờ phê duyệt",
                group.getId(),
                "GROUP",
                mediaService.getGroupAvatarUrl(group.getId())
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

        Optional<GroupMember> optionalMember = groupMemberRepository.findById(id);
        if (optionalMember.isPresent() && optionalMember.get().getStatus()) {
            throw new IllegalArgumentException("Bạn đã yêu cầu hoặc đã tham gia nhóm này");
        }

        GroupMember request = new GroupMember();
        request.setId(id);
        request.setGroup(group);
        request.setUser(user);
        request.setJoinAt(Instant.now());
        request.setIsAdmin(false);
        request.setStatus(true);

        String displayName = user.getDisplayName() != null ? user.getDisplayName() : user.getUsername();
        String groupAvatarUrl = mediaService.getGroupAvatarUrl(group.getId());

        if ("public".equalsIgnoreCase(group.getPrivacyLevel())) {
            request.setInviteStatus("ACCEPTED");
            groupMemberRepository.save(request);

            // Sửa: Thêm tham số image
            notificationService.sendNotification(
                    group.getOwner().getId(),
                    "GROUP_USER_JOINED",
                    displayName + " đã tham gia nhóm " + group.getName(),
                    group.getId(),
                    "GROUP",
                    groupAvatarUrl
            );
        } else if ("private".equalsIgnoreCase(group.getPrivacyLevel())) {
            request.setInviteStatus("REQUESTED");
            groupMemberRepository.save(request);

            notificationService.sendNotification(
                    group.getOwner().getId(),
                    "GROUP_JOIN_REQUEST",
                    displayName + " đã yêu cầu tham gia nhóm " + group.getName(),
                    group.getId(),
                    "GROUP",
                    groupAvatarUrl
            );
        } else {
            throw new UnauthorizedException("Bạn không thể tự tham gia nhóm này");
        }
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

        // Notify the user that their join request was approved
        User user = member.getUser();
        String displayName = user.getDisplayName() != null ? user.getDisplayName() : user.getUsername();
        notificationService.sendNotification(
                userId,
                "GROUP_REQUEST_APPROVED",
                "Yêu cầu tham gia nhóm " + group.getName() + " của bạn đã được duyệt",
                group.getId(),
                "GROUP",
                mediaService.getGroupAvatarUrl(group.getId())
        );
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

        // Notify the user that their join request was rejected
        User user = member.getUser();
        String displayName = user.getDisplayName() != null ? user.getDisplayName() : user.getUsername();
        notificationService.sendNotification(
                userId,
                "GROUP_REQUEST_REJECTED",
                "Yêu cầu tham gia nhóm " + group.getName() + " của bạn đã bị từ chối",
                group.getId(),
                "GROUP",
                mediaService.getGroupAvatarUrl(group.getId())
        );
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
                            user.getDisplayName(),
                            user.getUsername(),
                            mediaService.getAvatarUrlByUserId(user.getId())
                    );
                })
                .collect(Collectors.toList());
    }

    public GroupDisplayDto getGroupDetail(Integer groupId, String viewerUsername) {
        Group group = groupRepository.findByIdAndStatusTrue(groupId)
                .orElseThrow(() -> new NotFoundException("Group không tồn tại"));

        User viewer = userRepository.findByUsernameAndStatusTrue(viewerUsername)
                .orElseThrow(() -> new UserNotFoundException("Người dùng không tồn tại"));

        int memberCount = groupMemberRepository.findAcceptedMembers(groupId).size();

        boolean isAdmin = Boolean.TRUE.equals(groupMemberRepository.isGroupAdmin(groupId, viewer.getId()));
        boolean isOwner = group.getOwner().getId().equals(viewer.getId());

        Optional<GroupMember> memberOpt = groupMemberRepository.findById(new GroupMemberId(groupId, viewer.getId()));
        String inviteStatus = memberOpt.map(GroupMember::getInviteStatus).orElse(null);

        boolean isMember = memberOpt.map(m ->
                "ACCEPTED".equals(m.getInviteStatus()) && Boolean.TRUE.equals(m.getStatus())
        ).orElse(false);

        List<UserBasicDisplayDto> mutualFriends = getMutualFriendsInGroup(groupId, viewer.getId());

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
                isMember,
                group.getPrivacyLevel(),
                inviteStatus,
                mutualFriends,
                group.getStatus()
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
                            true, // ✅ isMember = true
                            group.getPrivacyLevel(),
                            member.getInviteStatus(),
                            List.of(),
                            group.getStatus()
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

    private List<UserBasicDisplayDto> getMutualFriendsInGroup(Integer groupId, Integer userId) {
        // Lấy tất cả quan hệ bạn bè đã accept
        List<Friendship> friendships = friendshipRepository.findAll().stream()
                .filter(f -> f.getStatus() && "accepted".equals(f.getFriendshipStatus()) &&
                        (f.getUser().getId().equals(userId) || f.getFriend().getId().equals(userId)))
                .collect(Collectors.toList());

        Set<Integer> friendIds = friendships.stream()
                .map(f -> f.getUser().getId().equals(userId) ? f.getFriend().getId() : f.getUser().getId())
                .collect(Collectors.toSet());

        if (friendIds.isEmpty()) return List.of();

        List<GroupMember> members = groupMemberRepository.findAcceptedMembersByGroupIdAndUserIds(groupId, new ArrayList<>(friendIds));

        return members.stream()
                .map(m -> {
                    User u = m.getUser();
                    return new UserBasicDisplayDto(
                            u.getId(),
                            u.getDisplayName(),
                            u.getUsername(),
                            mediaService.getAvatarUrlByUserId(u.getId())
                    );
                }).collect(Collectors.toList());
    }

    @Transactional
    public void cancelJoinRequest(Integer groupId, String username) {
        User user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("Người dùng không tồn tại"));

        GroupMember member = groupMemberRepository.findById(new GroupMemberId(groupId, user.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Yêu cầu tham gia không tồn tại"));

        if (!"REQUESTED".equals(member.getInviteStatus())) {
            throw new IllegalStateException("Chỉ có thể hủy khi đang ở trạng thái yêu cầu tham gia");
        }

        groupMemberRepository.delete(member);
    }

    public boolean hasPermissionToViewMembers(Integer groupId, String username) {
        Optional<User> userOpt = userRepository.findByUsernameAndStatusTrue(username);
        if (userOpt.isEmpty()) return false;

        User user = userOpt.get();

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new NotFoundException("Group không tồn tại"));

        if ("public".equalsIgnoreCase(group.getPrivacyLevel())) return true;

        if (group.getOwner().getId().equals(user.getId())) return true;

        Boolean isAdmin = groupMemberRepository.isGroupAdmin(groupId, user.getId());
        if (Boolean.TRUE.equals(isAdmin)) return true;

        return groupMemberRepository.existsById_GroupIdAndId_UserIdAndInviteStatus(groupId, user.getId(), "ACCEPTED");
    }


}
