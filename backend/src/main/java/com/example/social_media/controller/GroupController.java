package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.group.GroupCreateDto;
import com.example.social_media.dto.group.GroupDisplayDto;
import com.example.social_media.dto.group.GroupSimpleDto;
import com.example.social_media.dto.user.UserBasicDisplayDto;
import com.example.social_media.entity.Group;
import com.example.social_media.jwt.JwtService;
import com.example.social_media.service.GroupService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(URLConfig.GROUP_BASE)
public class GroupController {

    private final GroupService groupService;
    private final JwtService jwtService;

    public GroupController(GroupService groupService,
                           JwtService jwtService) {
        this.groupService = groupService;
        this.jwtService = jwtService;
    }

    @PostMapping(value = URLConfig.CREATE_GROUP, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createGroup(
            @RequestPart("data") String jsonData,
            @RequestPart(value = "avatar", required = false) MultipartFile avatar
    ) throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        GroupCreateDto dto = objectMapper.readValue(jsonData, GroupCreateDto.class);

        if (dto == null || dto.getName() == null || dto.getOwnerUsername() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Thiếu thông tin nhóm",
                    "errors", new HashMap<>()
            ));
        }

        String privacyLevel = (dto.getPrivacyLevel() == null || dto.getPrivacyLevel().isBlank())
                ? "public" : dto.getPrivacyLevel();

        Group group = groupService.createGroup(
                dto.getOwnerUsername(),
                dto.getName(),
                dto.getDescription(),
                privacyLevel,
                avatar
        );

        GroupDisplayDto groupDto = groupService.getGroupDetail(group.getId(), dto.getOwnerUsername());

        return ResponseEntity.ok(Map.of(
                "message", "Tạo nhóm thành công",
                "data", groupDto
        ));
    }

    @PutMapping(value = "/{groupId}", consumes = {"multipart/form-data"})
    public ResponseEntity<Map<String, Object>> updateGroup(
            @PathVariable Integer groupId,
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam(defaultValue = "public") String privacyLevel,
            @RequestPart(value = "avatar", required = false) MultipartFile avatarFile,
            @RequestHeader("Authorization") String authHeader
    ) throws IOException {
        String token = authHeader.substring(7);
        String username = jwtService.extractUsername(token);
        Group updatedGroup = groupService.updateGroup(groupId, username, name, description, privacyLevel, avatarFile);
        GroupDisplayDto groupDto = groupService.getGroupDetail(groupId, username);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Cập nhật nhóm thành công");
        response.put("data", groupDto);
        return ResponseEntity.ok(response);
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
    public ResponseEntity<Map<String, Object>> getMembers(
            @PathVariable Integer groupId,
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        String token = authHeader.substring(7); // bỏ "Bearer "
        String username = jwtService.extractUsername(token);

        if (!groupService.isMember(groupId, username)) {
            return ResponseEntity.status(403).body(Map.of(
                    "status", "error",
                    "message", "Bạn không có quyền xem danh sách thành viên",
                    "errors", new HashMap<>()
            ));
        }

        return ResponseEntity.ok(groupService.getGroupMembers(groupId, page, size));
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
    public ResponseEntity<List<GroupSimpleDto>> getPendingInvites(
            @RequestParam String username) {
        return ResponseEntity.ok(groupService.getPendingInviteSummaries(username));
    }

    @PostMapping(URLConfig.REQUEST_JOIN_GROUP)
    public ResponseEntity<Void> requestToJoinGroup(
            @PathVariable Integer groupId,
            @RequestHeader("Authorization") String token
    ) {
        String username = jwtService.extractUsername(token);
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

    @GetMapping(URLConfig.GET_GROUP_DETAIL)
    public ResponseEntity<?> getGroupDetail(
            @PathVariable Integer groupId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String viewerUsername = userDetails.getUsername();
        return ResponseEntity.ok(groupService.getGroupDetail(groupId, viewerUsername));
    }

    @GetMapping("/your-groups")
    public ResponseEntity<List<GroupDisplayDto>> getGroupsOfUser(@RequestParam String username) {
        return ResponseEntity.ok(groupService.getGroupsOfUser(username));
    }


    // 1. Lấy danh sách cộng đồng
    @GetMapping("")
    public ResponseEntity<?> getAllGroups() {
        return ResponseEntity.ok(groupService.getAllGroupSummaries());
    }


    // 2. Xem chi tiết cộng đồng
    @GetMapping("/{id}")
    public ResponseEntity<Group> getGroupById(@PathVariable Integer id) {
        return groupService.getGroupById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. Xóa cộng đồng
    @DeleteMapping(URLConfig.DELETE_GROUP_BY_ADMIN)
    public ResponseEntity<Void> deleteGroupByAdmin(@PathVariable Integer groupId) {
        groupService.deleteGroupAsAdmin(groupId);
        return ResponseEntity.ok().build();
    }
        @DeleteMapping("/{groupId}/leave")
        public ResponseEntity<?> leaveGroup (@PathVariable Integer groupId,
                @RequestHeader("Authorization") String token){
            String username = jwtService.extractUsername(token);
            groupService.leaveGroup(groupId, username);
            return ResponseEntity.ok().body(Map.of("message", "Rời khỏi nhóm thành công"));

        }

    }
