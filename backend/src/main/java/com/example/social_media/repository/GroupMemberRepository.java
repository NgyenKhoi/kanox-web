package com.example.social_media.repository;

import com.example.social_media.entity.GroupMember;
import com.example.social_media.entity.GroupMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, GroupMemberId> {
} 