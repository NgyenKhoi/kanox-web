package com.example.social_media.service;

import com.example.social_media.entity.GroupMember;
import com.example.social_media.entity.GroupMemberId;
import com.example.social_media.repository.GroupMemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GroupMemberService {
    @Autowired
    private GroupMemberRepository groupMemberRepository;

    public List<GroupMember> getAllGroupMembers() {
        return groupMemberRepository.findAll();
    }

    public Optional<GroupMember> getGroupMemberById(GroupMemberId id) {
        return groupMemberRepository.findById(id);
    }

    public GroupMember createGroupMember(GroupMember groupMember) {
        return groupMemberRepository.save(groupMember);
    }

    public GroupMember updateGroupMember(GroupMember groupMember) {
        return groupMemberRepository.save(groupMember);
    }

    public void deleteGroupMember(GroupMemberId id) {
        groupMemberRepository.deleteById(id);
    }
} 