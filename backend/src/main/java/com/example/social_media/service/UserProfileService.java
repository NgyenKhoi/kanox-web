package com.example.social_media.service;

import com.example.social_media.dto.UserProfileDto;
import com.example.social_media.entity.User;
import com.example.social_media.repository.FollowRepository;
import com.example.social_media.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserProfileService {

    private final UserRepository userRepository;

    private final FollowRepository followRepository;

    public UserProfileService(UserRepository userRepository, FollowRepository followRepository) {
        this.userRepository = userRepository;
        this.followRepository = followRepository;
    }

    public UserProfileDto getUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int followerCount = followRepository.countByFolloweeAndStatusTrue(user);
        int followeeCount = followRepository.countByFollowerAndStatusTrue(user);

        return new UserProfileDto(
                user.getUsername(),
                user.getDisplayName(),
                user.getEmail(),
                user.getBio(),
                user.getGender(),
                user.getDateOfBirth(),
                followerCount,
                followeeCount
        );
    }
}