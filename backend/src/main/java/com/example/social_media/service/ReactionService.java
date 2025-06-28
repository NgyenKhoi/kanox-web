package com.example.social_media.service;

import com.example.social_media.dto.ReactionTypeCountDto;
import com.example.social_media.entity.Reaction;
import com.example.social_media.entity.ReactionId;
import com.example.social_media.entity.ReactionType;
import com.example.social_media.repository.ReactionRepository;
import com.example.social_media.repository.ReactionTypeRepository;
import com.example.social_media.repository.TargetTypeRepository;
import com.example.social_media.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReactionService {

    private final ReactionRepository reactionRepository;
    private final ReactionTypeRepository reactionTypeRepository;
    private final UserRepository userRepository;
    private final TargetTypeRepository targetTypeRepository;

    private static final Set<String> MAIN_REACTIONS = Set.of(
            "like", "love", "haha", "sad", "wow", "angry"
    );

    public void addOrUpdateReaction(Integer userId, Integer targetId, Integer targetTypeId, Integer reactionTypeId) {
        ReactionId reactionId = new ReactionId();
        reactionId.setUserId(userId);
        reactionId.setTargetId(targetId);
        reactionId.setTargetTypeId(targetTypeId);

        Reaction existingReaction = reactionRepository.findById(reactionId).orElse(null);

        if (existingReaction != null) {
            if (existingReaction.getReactionType().getId().equals(reactionTypeId)) {
                return;
            }

            existingReaction.setReactionType(reactionTypeRepository.getReferenceById(reactionTypeId));
            existingReaction.setCreatedAt(Instant.now());
            existingReaction.setStatus(true);
            reactionRepository.save(existingReaction);
        } else {
            Reaction reaction = new Reaction();
            reaction.setId(reactionId);
            reaction.setUser(userRepository.getReferenceById(userId));
            reaction.setTargetType(targetTypeRepository.getReferenceById(targetTypeId));
            reaction.setReactionType(reactionTypeRepository.getReferenceById(reactionTypeId));
            reaction.setCreatedAt(Instant.now());
            reaction.setStatus(true);

            reactionRepository.save(reaction);
        }
    }

    public void removeReaction(Integer userId, Integer targetId, Integer targetTypeId) {
        reactionRepository.deleteByIdUserIdAndIdTargetIdAndIdTargetTypeId(userId, targetId, targetTypeId);
    }

    public List<ReactionTypeCountDto> getTop3Reactions(Integer targetId, Integer targetTypeId) {
        List<Reaction> reactions = reactionRepository.findByIdTargetIdAndIdTargetTypeIdAndStatusTrue(targetId, targetTypeId);

        Map<ReactionType, Long> grouped = reactions.stream()
                .collect(Collectors.groupingBy(Reaction::getReactionType, Collectors.counting()));

        return grouped.entrySet().stream()
                .sorted(Map.Entry.<ReactionType, Long>comparingByValue().reversed())
                .limit(3)
                .map(entry -> new ReactionTypeCountDto(entry.getKey(), entry.getValue()))
                .toList();
    }

    public Map<ReactionType, Long> countAllReactions(Integer targetId, Integer targetTypeId) {
        List<Reaction> reactions = reactionRepository.findByIdTargetIdAndIdTargetTypeIdAndStatusTrue(targetId, targetTypeId);
        return reactions.stream()
                .collect(Collectors.groupingBy(Reaction::getReactionType, Collectors.counting()));
    }

    public List<ReactionType> getAvailableReactionsForMessaging() {
        return reactionTypeRepository.findAll()
                .stream()
                .filter(rt -> Boolean.TRUE.equals(rt.getStatus()))
                .toList();
    }

    public List<ReactionType> getMainReactions() {
        return reactionTypeRepository.findAll()
                .stream()
                .filter(rt -> MAIN_REACTIONS.contains(rt.getName().toLowerCase()))
                .toList();
    }
}
