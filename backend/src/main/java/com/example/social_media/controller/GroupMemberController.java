package com.example.social_media.controller;

import com.example.social_media.entity.GroupMember;
import com.example.social_media.entity.GroupMemberId;
import com.example.social_media.service.GroupMemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/group-members")
public class GroupMemberController {
    @Autowired
    private GroupMemberService groupMemberService;

    @GetMapping
    public List<GroupMember> getAllGroupMembers() {
        return groupMemberService.getAllGroupMembers();
    }

    @GetMapping("/{groupId}/{userId}")
    public ResponseEntity<GroupMember> getGroupMemberById(
            @PathVariable Integer groupId,
            @PathVariable Integer userId) {
        GroupMemberId id = new GroupMemberId();
        id.setGroupId(groupId);
        id.setUserId(userId);
        return groupMemberService.getGroupMemberById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public GroupMember createGroupMember(@RequestBody GroupMember groupMember) {
        return groupMemberService.createGroupMember(groupMember);
    }

    @PutMapping("/{groupId}/{userId}")
    public ResponseEntity<GroupMember> updateGroupMember(
            @PathVariable Integer groupId,
            @PathVariable Integer userId,
            @RequestBody GroupMember groupMember) {
        GroupMemberId id = new GroupMemberId();
        id.setGroupId(groupId);
        id.setUserId(userId);
        return groupMemberService.getGroupMemberById(id)
                .map(existingMember -> {
                    groupMember.setId(id);
                    return ResponseEntity.ok(groupMemberService.updateGroupMember(groupMember));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{groupId}/{userId}")
    public ResponseEntity<Void> deleteGroupMember(
            @PathVariable Integer groupId,
            @PathVariable Integer userId) {
        GroupMemberId id = new GroupMemberId();
        id.setGroupId(groupId);
        id.setUserId(userId);
        return groupMemberService.getGroupMemberById(id)
                .map(member -> {
                    groupMemberService.deleteGroupMember(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
} 