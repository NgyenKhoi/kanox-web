package com.example.social_media.service;

import com.example.social_media.dto.friend.PageResponseDto;
import com.example.social_media.dto.user.UserTagDto;
import com.example.social_media.entity.Friendship;
import com.example.social_media.entity.FriendshipId;
import com.example.social_media.entity.User;
import com.example.social_media.exception.RegistrationException;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.FriendshipRepository;
import com.example.social_media.repository.UserRepository;
import com.example.social_media.service.CustomUserDetailsService;
import com.example.social_media.service.NotificationService;
import com.example.social_media.service.UserProfileService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FriendshipService {
    private final FriendshipRepository friendshipRepository;
    private final CustomUserDetailsService customUserDetailsService;
    private final UserProfileService userProfileService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final PrivacyService privacyService;

    public FriendshipService(
            FriendshipRepository friendshipRepository,
            CustomUserDetailsService customUserDetailsService,
            UserProfileService userProfileService,
            UserRepository userRepository,
            NotificationService notificationService,
            PrivacyService privacyService
    ) {
        this.friendshipRepository = friendshipRepository;
        this.customUserDetailsService = customUserDetailsService;
        this.userProfileService = userProfileService;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.privacyService = privacyService;
    }

    @Transactional
    public void sendFriendRequest(Integer userId, Integer receiverId) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User sender = customUserDetailsService.getUserByUsername(currentUsername);
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + receiverId));

        if (userId.equals(receiverId)) {
            throw new IllegalArgumentException("Cannot send friend request to yourself");
        }

        if (friendshipRepository.existsByUserAndFriendAndStatus(sender, receiver, true)) {
            throw new IllegalArgumentException("Friend request already sent or already friends");
        }

        if (friendshipRepository.existsByUserAndFriendAndStatus(receiver, sender, true)) {
            throw new IllegalArgumentException("Friend request already received");
        }

        Friendship friendship = new Friendship();
        FriendshipId id = new FriendshipId();
        id.setUserId(userId);
        id.setFriendId(receiverId);
        friendship.setId(id);
        friendship.setUser(sender);
        friendship.setFriend(receiver);
        friendship.setFriendshipStatus("pending");
        friendship.setCreatedAt(Instant.now());
        friendship.setStatus(true);

        friendshipRepository.save(friendship);

        notificationService.sendNotification(
                receiverId,
                "FRIEND_REQUEST",
                "Người dùng " + userId + " đã gửi cho bạn lời mời kết bạn",
                userId,
                "PROFILE"
        );
    }

    @Transactional
    public void acceptFriendRequest(Integer userId, Integer requesterId) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = customUserDetailsService.getUserByUsername(currentUsername);
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + requesterId));

        Friendship friendship = friendshipRepository.findByUserAndFriendAndStatus(requester, user, true)
                .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));

        if (!friendship.getFriendshipStatus().equals("pending")) {
            throw new IllegalArgumentException("Friend request is not pending");
        }

        friendship.setFriendshipStatus("accepted");
        friendshipRepository.save(friendship);

        notificationService.sendNotification(
                requesterId,
                "FRIEND_ACCEPTED",
                user.getDisplayName() + " đã chấp nhận lời mời kết bạn của bạn",
                userId,
                "friendship"
        );
    }

    @Transactional
    public void rejectFriendRequest(Integer userId, Integer requesterId) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = customUserDetailsService.getUserByUsername(currentUsername);
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + requesterId));

        Friendship friendship = friendshipRepository.findByUserAndFriendAndStatus(requester, user, true)
                .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));

        if (!friendship.getFriendshipStatus().equals("pending")) {
            throw new IllegalArgumentException("Friend request is not pending");
        }

        friendship.setStatus(false);
        friendshipRepository.save(friendship);
    }

    @Transactional
    public void cancelFriendship(Integer userId, Integer friendId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + friendId));

        Friendship friendship = friendshipRepository.findByUserAndFriendAndStatus(user, friend, true)
                .orElseGet(() -> friendshipRepository.findByUserAndFriendAndStatus(friend, user, true)
                        .orElseThrow(() -> new IllegalArgumentException("Friendship not found")));

        friendship.setStatus(false);
        friendshipRepository.save(friendship);
    }

    public PageResponseDto<UserTagDto> getFriends(Integer userId, Integer viewerId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        if (!privacyService.checkContentAccess(viewerId, userId, "PROFILE")) {
            throw new IllegalArgumentException("Access denied to view friends list");
        }
        Page<Friendship> friendships = friendshipRepository.findByUserAndFriendshipStatusAndStatus(user, "accepted", true, pageable);
        List<UserTagDto> friends = friendships.getContent().stream()
                .map(friendship -> new UserTagDto(friendship.getFriend()))
                .collect(Collectors.toList());

        return new PageResponseDto<>(
                friends,
                friendships.getNumber(),
                friendships.getSize(),
                friendships.getTotalElements(),
                friendships.getTotalPages(),
                friendships.isFirst(),
                friendships.isLast()
        );
    }

    public PageResponseDto<UserTagDto> getSentPendingRequests(Integer userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        Page<Friendship> sentRequests = friendshipRepository.findByUserAndFriendshipStatusAndStatus(user, "pending", true, pageable);
        List<UserTagDto> users = sentRequests.getContent().stream()
                .map(friendship -> new UserTagDto(friendship.getFriend()))
                .collect(Collectors.toList());

        return new PageResponseDto<>(
                users,
                sentRequests.getNumber(),
                sentRequests.getSize(),
                sentRequests.getTotalElements(),
                sentRequests.getTotalPages(),
                sentRequests.isFirst(),
                sentRequests.isLast()
        );
    }

    public PageResponseDto<UserTagDto> getReceivedPendingRequests(Integer userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        Page<Friendship> receivedRequests = friendshipRepository.findByFriendAndFriendshipStatusAndStatus(user, "pending", true, pageable);
        List<UserTagDto> users = receivedRequests.getContent().stream()
                .map(friendship -> new UserTagDto(friendship.getUser()))
                .collect(Collectors.toList());

        return new PageResponseDto<>(
                users,
                receivedRequests.getNumber(),
                receivedRequests.getSize(),
                receivedRequests.getTotalElements(),
                receivedRequests.getTotalPages(),
                receivedRequests.isFirst(),
                receivedRequests.isLast()
        );
    }
}