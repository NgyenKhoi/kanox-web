package com.example.social_media.dto.reaction;

import com.example.social_media.entity.ReactionType;

public class ReactionResponseDto {
    private String name;
    private String emoji;

    public ReactionResponseDto(ReactionType reactionType) {
        this.name = reactionType.getName();
        this.emoji = reactionType.getEmoji();
    }

    public String getName() {
        return name;
    }

    public void setName(String emojiName) {
        this.name = emojiName;
    }

    public String getEmoji() {
        return emoji;
    }

    public void setEmoji(String emoji) {
        this.emoji = emoji;
    }
}
