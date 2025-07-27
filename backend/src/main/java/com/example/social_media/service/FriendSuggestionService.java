package com.example.social_media.service;

import com.example.social_media.dto.user.UserDto;
import com.example.social_media.entity.FriendSuggestion;
import com.example.social_media.repository.FriendSuggestionRepository;
import com.example.social_media.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
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


    public List<UserDto> getFriendSuggestions(Integer userId) {
        System.out.println("Get suggestions for user: " + userId);
        List<FriendSuggestion> suggestions = friendSuggestionRepository.findByUserId(userId);
        System.out.println("Suggestions size: " + suggestions.size());
        suggestions.forEach(s -> {
            System.out.println("Suggested: " + s.getId().getSuggestedUserId());
        });
        return suggestions.stream()
                .map(suggestion -> {
                    return userRepository.findById(suggestion.getId().getSuggestedUserId())
                            .map(user -> new UserDto(
                                    user.getId(),
                                    user.getUsername(),
                                    user.getDisplayName(),
                                    suggestion.getMutualFriendCount()
                            ))
                            .orElse(null);
                })
                .filter(userDto -> userDto != null)
                .collect(Collectors.toList());
    }
}