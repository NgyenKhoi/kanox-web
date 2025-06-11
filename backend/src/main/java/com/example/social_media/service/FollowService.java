package com.example.social_media.service;

import com.example.social_media.dto.friend.PageResponseDto;
import com.example.social_media.dto.user.UserTagDto;
import com.example.social_media.entity.Follow;
import com.example.social_media.entity.FollowId;
import com.example.social_media.entity.User;
import com.example.social_media.exception.RegistrationException;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.BlockRepository;
import com.example.social_media.repository.FollowRepository;
import com.example.social_media.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FollowService {
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final BlockRepository blockRepository;
    private final PrivacyService privacyService;
    private final NotificationService notificationService;
    private final ActivityLogService activityLogService;

    public FollowService(
            UserRepository userRepository,
            FollowRepository followRepository,
            BlockRepository blockRepository,
            PrivacyService privacyService,
            NotificationService notificationService,
            ActivityLogService activityLogService
    ) {
        this.userRepository = userRepository;
        this.followRepository = followRepository;
        this.blockRepository = blockRepository;
        this.privacyService = privacyService;
        this.notificationService = notificationService;
        this.activityLogService = activityLogService;
    }

    @Transactional
    public void followUser(Integer followerId, Integer followeeId) {
        if (followerId.equals(followeeId)) {
            throw new IllegalArgumentException("Cannot follow yourself");
        }

        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + followerId));
        User followee = userRepository.findById(followeeId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + followeeId));

        if (blockRepository.existsByUserAndBlockedUserAndStatus(followee, follower, true)) {
            throw new IllegalArgumentException("User is blocked");
        }
        if (blockRepository.existsByUserAndBlockedUserAndStatus(follower, followee, true)) {
            throw new IllegalArgumentException("User is blocked");
        }

        if (followRepository.existsByFollowerAndFolloweeAndStatus(follower, followee, true)) {
            throw new IllegalArgumentException("Already following user");
        }

        Follow follow = new Follow();
        FollowId id = new FollowId();
        id.setFollowerId(followerId);
        id.setFolloweeId(followeeId);
        follow.setId(id);
        follow.setFollower(follower);
        follow.setFollowee(followee);
        follow.setCreatedAt(Instant.now());
        follow.setStatus(true);

        followRepository.save(follow);

        notificationService.sendNotification(
                followeeId,
                "FOLLOW",
                String.format("%s started following you.", follower.getUsername()),
                followerId,
                "PROFILE"
        );

        activityLogService.logActivity(
                followerId,
                "FOLLOW",
                null,
                null,
                followeeId,
                "PROFILE"
        );
    }

    @Transactional
    public void unfollowUser(Integer followerId, Integer followeeId) {
        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + followerId));
        User followee = userRepository.findById(followeeId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + followeeId));

        Follow follow = followRepository.findByFollowerAndFolloweeAndStatus(follower, followee, true)
                .orElseThrow(() -> new IllegalArgumentException("Not following user"));

        follow.setStatus(false);
        followRepository.save(follow);

        activityLogService.logActivity(
                followerId,
                "UNFOLLOW",
                null,
                null,
                followeeId,
                "PROFILE"
        );
    }

    public PageResponseDto<UserTagDto> getFollowing(Integer userId, Integer viewerId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        if (!privacyService.checkContentAccess(viewerId, userId, "PROFILE")) {
            throw new IllegalArgumentException("Access denied");
        }

        Page<Follow> following = followRepository.findByFollowerAndStatus(user, true, pageable);
        List<UserTagDto> followingList = following.getContent().stream()
                .map(f -> new UserTagDto(f.getFollowee()))
                .filter(dto -> !blockRepository.existsByUserAndBlockedUserAndStatus(
                        new User(dto.getId()), new User(viewerId), true) &&
                        !blockRepository.existsByUserAndBlockedUserAndStatus(
                                new User(viewerId), new User(dto.getId()), true))
                .collect(Collectors.toList());

        return new PageResponseDto<>(
                followingList,
                following.getNumber(),
                following.getSize(),
                following.getTotalElements(),
                following.getTotalPages(),
                following.isFirst(),
                following.isLast()
        );
    }

    public PageResponseDto<UserTagDto> getFollowers(Integer userId, Integer viewerId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        if (!privacyService.checkContentAccess(viewerId, userId, "PROFILE")) {
            throw new IllegalArgumentException("Access denied");
        }

        Page<Follow> followers = followRepository.findByFolloweeAndStatus(user, true, pageable);
        List<UserTagDto> followersList = followers.getContent().stream()
                .map(f -> new UserTagDto(f.getFollower()))
                .filter(dto -> !blockRepository.existsByUserAndBlockedUserAndStatus(
                        new User(dto.getId()), new User(viewerId), true) &&
                        !blockRepository.existsByUserAndBlockedUserAndStatus(
                                new User(viewerId), new User(dto.getId()), true))
                .collect(Collectors.toList());

        return new PageResponseDto<>(
                followersList,
                followers.getNumber(),
                followers.getSize(),
                followers.getTotalElements(),
                followers.getTotalPages(),
                followers.isFirst(),
                followers.isLast()
        );
    }
}