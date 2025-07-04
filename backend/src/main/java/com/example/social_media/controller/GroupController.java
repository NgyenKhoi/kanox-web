package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.user.UserBasicDisplayDto;
import com.example.social_media.entity.Group;
import com.example.social_media.service.GroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(URLConfig.GROUP_BASE)
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @PostMapping(URLConfig.CREATE_GROUP)
    public ResponseEntity<Group> createGroup(
            @RequestParam String ownerUsername,
            @RequestParam String name,
            @RequestParam(required = false) String description) {
        Group group = groupService.createGroup(ownerUsername, name, description);
        return ResponseEntity.ok(group);
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable Integer groupId,
            @RequestParam String username) {
        groupService.deleteGroup(groupId, username);
        return ResponseEntity.ok().build();
    }

    @PostMapping(URLConfig.ADD_MEMBER)
    public ResponseEntity<Void> addMember(
            @PathVariable Integer groupId,
            @RequestParam String username) {
        groupService.addMember(groupId, username);
        return ResponseEntity.ok().build();
    }

    @PostMapping(URLConfig.REMOVE_MEMBER)
    public ResponseEntity<Void> removeMember(
            @PathVariable Integer groupId,
            @RequestParam Integer targetUserId,
            @RequestParam String requesterUsername) {
        groupService.removeMember(groupId, targetUserId, requesterUsername);
        return ResponseEntity.ok().build();
    }

    @PostMapping(URLConfig.ASSIGN_ADMIN)
    public ResponseEntity<Void> assignAdmin(
            @PathVariable Integer groupId,
            @RequestParam Integer targetUserId,
            @RequestParam String requesterUsername) {
        groupService.assignAdmin(groupId, targetUserId, requesterUsername);
        return ResponseEntity.ok().build();
    }

    @GetMapping(URLConfig.GET_MEMBER)
    public ResponseEntity<List<UserBasicDisplayDto>> getMembers(
            @PathVariable Integer groupId) {
        return ResponseEntity.ok(groupService.getGroupMembers(groupId));
    }

    @PostMapping(URLConfig.INVITE_MEMBER)
    public ResponseEntity<Void> inviteMember(
            @PathVariable Integer groupId,
            @RequestParam String usernameToInvite) {
        groupService.inviteMember(groupId, usernameToInvite);
        return ResponseEntity.ok().build();
    }

    @PostMapping(URLConfig.ACCEPT_INVITE)
    public ResponseEntity<Void> acceptInvite(
            @PathVariable Integer groupId,
            @RequestParam String username) {
        groupService.acceptInvite(groupId, username);
        return ResponseEntity.ok().build();
    }

    @PostMapping(URLConfig.REJECT_INVITE)
    public ResponseEntity<Void> rejectInvite(
            @PathVariable Integer groupId,
            @RequestParam String username) {
        groupService.rejectInvite(groupId, username);
        return ResponseEntity.ok().build();
    }

    @GetMapping(URLConfig.PENDING_INVITE)
    public ResponseEntity<List<Group>> getPendingInvites(
            @RequestParam String username) {
        return ResponseEntity.ok(groupService.getPendingInvites(username));
    }

    @PostMapping(URLConfig.REQUEST_JOIN_GROUP)
    public ResponseEntity<Void> requestToJoinGroup(
            @PathVariable Integer groupId,
            @RequestParam String username) {
        groupService.requestToJoinGroup(groupId, username);
        return ResponseEntity.ok().build();
    }

    // Admin duyệt yêu cầu tham gia
    @PostMapping(URLConfig.APPROVE_JOIN_REQUEST)
    public ResponseEntity<Void> approveJoinRequest(
            @PathVariable Integer groupId,
            @RequestParam Integer userId,
            @RequestParam String adminUsername) {
        groupService.approveJoinRequest(groupId, userId, adminUsername);
        return ResponseEntity.ok().build();
    }

    // Admin từ chối yêu cầu tham gia
    @PostMapping(URLConfig.REJECT_JOIN_REQUEST)
    public ResponseEntity<Void> rejectJoinRequest(
            @PathVariable Integer groupId,
            @RequestParam Integer userId,
            @RequestParam String adminUsername) {
        groupService.rejectJoinRequest(groupId, userId, adminUsername);
        return ResponseEntity.ok().build();
    }

    // Lấy danh sách yêu cầu vào group (cho admin)
    @GetMapping(URLConfig.GET_JOIN_REQUESTS)
    public ResponseEntity<List<UserBasicDisplayDto>> getJoinRequestsForGroup(
            @PathVariable Integer groupId,
            @RequestParam String adminUsername) {
        return ResponseEntity.ok(groupService.getJoinRequestsForGroup(groupId, adminUsername));
    }
}
