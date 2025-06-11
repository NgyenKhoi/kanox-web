package com.example.social_media.repository;

import com.example.social_media.entity.CustomPrivacyListMember;
import com.example.social_media.entity.CustomPrivacyListMemberId;
import com.example.social_media.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CustomPrivacyListMemberRepository extends JpaRepository<CustomPrivacyListMember, CustomPrivacyListMemberId> {
    Optional<CustomPrivacyListMember> findByListIdAndMemberUser(Integer listId, User memberUser);
}