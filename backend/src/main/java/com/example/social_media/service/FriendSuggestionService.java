package com.example.social_media.service;

import com.example.social_media.dto.user.UserDto;
import com.example.social_media.entity.FriendSuggestion;
import com.example.social_media.entity.User;
import com.example.social_media.repository.FriendSuggestionRepository;
import com.example.social_media.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FriendSuggestionService {
    private final FriendSuggestionRepository friendSuggestionRepository;
    private final UserRepository userRepository;

    public FriendSuggestionService(FriendSuggestionRepository friendSuggestionRepository, UserRepository userRepository) {
        this.friendSuggestionRepository = friendSuggestionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void generateFriendSuggestions(Integer userId) {
        friendSuggestionRepository.updateAllFriendSuggestions(10.0);
    }


    @Transactional
    public List<UserDto> getFriendSuggestions(Integer userId) {
        friendSuggestionRepository.updateAllFriendSuggestions(10.0);
        List<FriendSuggestion> suggestions = friendSuggestionRepository.findByUserId(userId);
        List<UserDto> result = new ArrayList<>();
        for (FriendSuggestion suggestion : suggestions) {
            User suggestedUser = suggestion.getSuggestedUser();
            if (suggestedUser != null) {
                List<UserDto> mutualFriends = new ArrayList<>();
                if (suggestion.getMutualFriendIds() != null && !suggestion.getMutualFriendIds().isEmpty()) {
                    System.out.println("Mutual friend IDs for user " + suggestedUser.getId() + ": " + suggestion.getMutualFriendIds());
                    String[] friendIds = suggestion.getMutualFriendIds().split(",");
                    for (String friendId : friendIds) {
                        try {
                            Optional<User> friendOpt = userRepository.findById(Integer.parseInt(friendId.trim()));
                            if (friendOpt.isPresent()) {
                                User friend = friendOpt.get();
                                mutualFriends.add(new UserDto(
                                        friend.getId(),
                                        friend.getUsername(),
                                        friend.getDisplayName(),
                                        friend.getGender(),
                                        friend.getBio()
                                ));
                            } else {
                                System.out.println("Friend not found for ID: " + friendId);
                            }
                        } catch (NumberFormatException e) {
                            System.out.println("Invalid mutual friend ID: " + friendId);
                        }
                    }
                } else {
                    System.out.println("No mutual friend IDs for user " + suggestedUser.getId());
                }
                result.add(new UserDto(
                        suggestedUser.getId(),
                        suggestedUser.getUsername(),
                        suggestedUser.getDisplayName(),
                        suggestion.getReason(),
                        suggestion.getMutualFriendCount(),
                        suggestion.getDistanceKm(),
                        mutualFriends
                ));
            } else {
                System.out.println("Suggested user not found for ID: " + suggestion.getId().getSuggestedUserId());
            }
        }
        return result;
    }
}