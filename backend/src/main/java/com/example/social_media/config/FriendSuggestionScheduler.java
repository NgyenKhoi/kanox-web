package com.example.social_media.config;

import com.example.social_media.service.FriendSuggestionService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class FriendSuggestionScheduler {
    private final FriendSuggestionService friendSuggestionService;

    public FriendSuggestionScheduler(FriendSuggestionService friendSuggestionService) {
        this.friendSuggestionService = friendSuggestionService;
    }

    @Scheduled(cron = "0 0 2 * * ?")
    public void updateAllFriendSuggestions() {
        friendSuggestionService.updateAllFriendSuggestions();
    }
}