package com.example.social_media.repository;

import com.example.social_media.entity.Group;
import com.example.social_media.entity.GroupMember;
import com.example.social_media.entity.GroupMemberId;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, GroupMemberId> {

    @Modifying
    @Transactional
    @Query("UPDATE GroupMember gm SET gm.status = false WHERE gm.group.id = :groupId")
    void deactivateByGroupId(@Param("groupId") Integer groupId);

    Optional<GroupMember> findById_GroupIdAndId_UserId(Integer groupId, Integer userId);

    @Query("SELECT gm.isAdmin FROM GroupMember gm WHERE gm.id.groupId = :groupId AND gm.id.userId = :userId AND gm.status = true")
    Boolean isGroupAdmin(@Param("groupId") Integer groupId, @Param("userId") Integer userId);

    List<GroupMember> findById_GroupIdAndStatusTrue(Integer groupId);

    @Query("SELECT gm.group FROM GroupMember gm WHERE gm.user.id = :userId AND gm.inviteStatus = :status")
    List<Group> findGroupsByUserIdAndInviteStatus(@Param("userId") Integer userId, @Param("status") String status);

    List<GroupMember> findById_GroupIdAndInviteStatus(Integer groupId, String inviteStatus);
}

