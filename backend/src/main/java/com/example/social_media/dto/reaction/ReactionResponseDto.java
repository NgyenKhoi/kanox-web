package com.example.social_media.dto.reaction;

import com.example.social_media.entity.ReactionType;

public class ReactionResponseDto {
    private String emojiName;
    private String emoji;

    public ReactionResponseDto(ReactionType reactionType) {
        this.emojiName = reactionType.getName();
        this.emoji = reactionType.getEmoji();
    }

    public String getEmojiName() {
        return emojiName;
    }

    public void setEmojiName(String emojiName) {
        this.emojiName = emojiName;
    }

    public String getEmoji() {
        return emoji;
    }

    public void setEmoji(String emoji) {
        this.emoji = emoji;
    }
}
