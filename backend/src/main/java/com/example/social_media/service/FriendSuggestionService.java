package com.example.social_media.service;

import com.example.social_media.dto.user.UserDto;
import com.example.social_media.entity.FriendSuggestion;
import com.example.social_media.repository.FriendSuggestionRepository;
import com.example.social_media.repository.UserRepository;
import org.springframework.stereotype.Service;

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

    public void generateFriendSuggestions(Integer userId) {
        // Gọi stored procedure để cập nhật gợi ý
        friendSuggestionRepository.updateAllFriendSuggestions(10.0); // radius_km = 10
        // Xóa các gợi ý cũ của user nếu cần
        friendSuggestionRepository.deleteByUserId(userId);
    }

    public List<UserDto> getFriendSuggestions(Integer userId) {
        List<FriendSuggestion> suggestions = friendSuggestionRepository.findByUserIdAndExpirationDateAfter(
                userId, Instant.now());
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