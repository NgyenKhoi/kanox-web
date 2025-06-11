package com.example.social_media.service;

import com.example.social_media.entity.Block;
import com.example.social_media.entity.BlockId;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.BlockRepository;
import com.example.social_media.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class BlockService {
    private final BlockRepository blockRepository;
    private final UserRepository userRepository;

    public BlockService(BlockRepository blockRepository, UserRepository userRepository) {
        this.blockRepository = blockRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void blockUser(Integer userId, Integer blockedUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        User blockedUser = userRepository.findById(blockedUserId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + blockedUserId));
        if (userId.equals(blockedUserId)) {
            throw new IllegalArgumentException("Cannot block yourself");
        }
        if (blockRepository.existsByUserAndBlockedUserAndStatus(user, blockedUser, true)) {
            throw new IllegalArgumentException("User is already blocked");
        }

        // Khởi tạo và gán BlockId
        BlockId blockId = new BlockId();
        blockId.setUserId(userId);
        blockId.setBlockedUserId(blockedUserId);

        Block block = new Block();
        block.setId(blockId);
        block.setUser(user); // Liên kết với entity User
        block.setBlockedUser(blockedUser); // Liên kết với entity User
        block.setCreatedAt(Instant.now());
        block.setStatus(true);

        blockRepository.save(block);
    }

    @Transactional
    public void unblockUser(Integer userId, Integer blockedUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        User blockedUser = userRepository.findById(blockedUserId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + blockedUserId));
        Block block = blockRepository.findByUserAndBlockedUserAndStatus(user, blockedUser, true)
                .orElseThrow(() -> new IllegalArgumentException("User is not blocked"));

        // Cập nhật status mà không cần tạo BlockId mới
        block.setStatus(false);
        blockRepository.save(block);
    }
}