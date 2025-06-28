package com.example.social_media.dto.reaction;

import com.example.social_media.entity.ReactionType;

public class ReactionTypeCountDto {
    private ReactionType reactionType;
    private Long count;

    public ReactionTypeCountDto(ReactionType reactionType, Long count) {
        this.reactionType = reactionType;
        this.count = count;
    }

    public ReactionType getReactionType() {
        return reactionType;
    }

    public Long getCount() {
        return count;
    }
}
