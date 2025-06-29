package com.example.social_media.dto.reaction;

import com.example.social_media.entity.ReactionType;

public class ReactionTypeCountDto {
    private ReactionResponseDto reactionType;
    private Long count;

    public ReactionTypeCountDto(ReactionResponseDto reactionType, Long count) {
        this.reactionType = reactionType;
        this.count = count;
    }

    public ReactionResponseDto getReactionType() {
        return reactionType;
    }

    public Long getCount() {
        return count;
    }
}
