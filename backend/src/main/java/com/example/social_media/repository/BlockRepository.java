package com.example.social_media.repository;

import com.example.social_media.entity.Block;
import com.example.social_media.entity.BlockId;
import com.example.social_media.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BlockRepository extends JpaRepository<Block, BlockId> { // Sửa thành BlockId
    Optional<Block> findByUserAndBlockedUserAndStatus(User user, User blockedUser, Boolean status);
    boolean existsByUserAndBlockedUserAndStatus(User user, User blockedUser, Boolean status);
}