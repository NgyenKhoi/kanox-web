package com.example.social_media.repository;

import com.example.social_media.entity.CustomPrivacyListMember;
import com.example.social_media.entity.CustomPrivacyListMemberId;
import com.example.social_media.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomPrivacyListMemberRepository extends JpaRepository<CustomPrivacyListMember, CustomPrivacyListMemberId> {
    boolean existsByListIdAndMemberUserIdAndStatus(Integer listId, Integer memberUserId, Boolean status);
    Optional<CustomPrivacyListMember> findByListIdAndMemberUser(Integer listId, User memberUser);

    // Lấy danh sách thành viên theo listId và status
    @Query("SELECT m FROM CustomPrivacyListMember m WHERE m.list.id = :listId AND m.status = :status AND m.memberUser.status = true ORDER BY m.addedAt DESC")
    List<CustomPrivacyListMember> findAllByListIdAndStatus(Integer listId, Boolean status);

    // Xóa mềm thành viên
    @Modifying
    @Query("UPDATE CustomPrivacyListMember m SET m.status = false WHERE m.list.id = :listId AND m.memberUser.id = :memberUserId AND m.status = true")
    int deleteByListIdAndMemberUserId(Integer listId, Integer memberUserId);
}