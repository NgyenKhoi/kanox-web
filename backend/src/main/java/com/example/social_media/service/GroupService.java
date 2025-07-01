package com.example.social_media.service;

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

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GroupService {
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final MediaService mediaService;
    private final NotificationService notificationService;

    public GroupService(GroupRepository groupRepository,
                        GroupMemberRepository groupMemberRepository,
                        UserRepository userRepository,
                        MediaService mediaService,
                        NotificationService notificationService) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userRepository = userRepository;
        this.mediaService = mediaService;
        this.notificationService = notificationService;
    }

    @Transactional
    public Group createGroup(String ownerUsername, String name, String description) {
        User owner = userRepository.findByUsernameAndStatusTrue(ownerUsername)
                .orElseThrow(() -> new UserNotFoundException("Chủ sở hữu không tồn tại"));

        Group group = new Group();
        group.setOwner(owner);
        group.setName(name);
        group.setDescription(description);
        group.setCreatedAt(Instant.now());
        group.setStatus(true);
        group = groupRepository.save(group);

        GroupMemberId id = new GroupMemberId();
        id.setGroupId(group.getId());
        id.setUserId(owner.getId());

        GroupMember member = new GroupMember();
        member.setId(id);
        member.setGroup(group);
        member.setUser(owner);
        member.setJoinAt(Instant.now());
        member.setIsAdmin(true);
        member.setStatus(true);

        groupMemberRepository.save(member);

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

    public List<UserBasicDisplayDto> getGroupMembers(Integer groupId) {
        return groupMemberRepository.findById_GroupIdAndStatusTrue(groupId).stream()
                .map(member -> {
                    var user = member.getUser();
                    return new UserBasicDisplayDto(
                            user.getId(),
                            mediaService.getAvatarUrlByUserId(user.getId()), // Lấy avatar từ MediaService
                            user.getDisplayName(),
                            user.getUsername()
                    );
                })
                .collect(Collectors.toList());
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

        GroupMember member = groupMemberRepository.findById(new GroupMemberId(groupId, user.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Invite not found"));

        if (!"PENDING".equals(member.getInviteStatus())) {
            throw new IllegalStateException("Invite already handled");
        }

        member.setInviteStatus("ACCEPTED");
        member.setJoinAt(Instant.now());
        groupMemberRepository.save(member);
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

    public List<Group> getPendingInvites(String username) {
        User user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        return groupMemberRepository.findGroupsByUserIdAndInviteStatus(user.getId(), "PENDING");
    }
}
