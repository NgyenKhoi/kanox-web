package com.example.social_media.service;

import com.example.social_media.dto.reaction.ReactionResponseDto;
import com.example.social_media.dto.reaction.ReactionTypeCountDto;
import com.example.social_media.dto.user.UserBasicDisplayDto;
import com.example.social_media.entity.Reaction;
import com.example.social_media.entity.ReactionId;
import com.example.social_media.entity.ReactionType;
import com.example.social_media.entity.TargetType;
import com.example.social_media.repository.ReactionRepository;
import com.example.social_media.repository.ReactionTypeRepository;
import com.example.social_media.repository.TargetTypeRepository;
import com.example.social_media.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ReactionService {

    private final ReactionRepository reactionRepository;
    private final ReactionTypeRepository reactionTypeRepository;
    private final UserRepository userRepository;
    private final TargetTypeRepository targetTypeRepository;
    private MediaService mediaService;

    public ReactionService(ReactionRepository reactionRepository,
                           ReactionTypeRepository reactionTypeRepository,
                           UserRepository userRepository,
                           TargetTypeRepository targetTypeRepository,
                           MediaService mediaService) {
        this.reactionRepository = reactionRepository;
        this.reactionTypeRepository = reactionTypeRepository;
        this.userRepository = userRepository;
        this.targetTypeRepository = targetTypeRepository;
        this.mediaService = mediaService;
    }

    private static final Set<String> MAIN_REACTIONS = Set.of(
            "like", "love", "smile", "sad", "wow", "angry", "sleepy"
    );

    public void addOrUpdateReaction(Integer userId, Integer targetId, String targetTypeCode, String emojiName) {
        TargetType targetType = getTargetTypeByCode(targetTypeCode);
        var reactionType = reactionTypeRepository.findByNameIgnoreCase(emojiName.trim())
                .orElseThrow(() -> new IllegalArgumentException("Loại cảm xúc không hợp lệ: " + emojiName));

        ReactionId reactionId = new ReactionId(userId, targetId, targetType.getId());

        Reaction existing = reactionRepository.findById(reactionId).orElse(null);

        if (existing != null) {
            if (!existing.getReactionType().getId().equals(reactionType.getId())) {
                existing.setReactionType(reactionType);
                existing.setCreatedAt(Instant.now());
                existing.setStatus(true);
                reactionRepository.save(existing);
            }
        } else {
            Reaction reaction = new Reaction();
            reaction.setId(reactionId);
            reaction.setUser(userRepository.getReferenceById(userId));
            reaction.setTargetType(targetType);
            reaction.setReactionType(reactionType);
            reaction.setCreatedAt(Instant.now());
            reaction.setStatus(true);
            reactionRepository.save(reaction);
        }
    }

    public void removeReaction(Integer userId, Integer targetId, String targetTypeCode) {
        TargetType targetType = getTargetTypeByCode(targetTypeCode);
        reactionRepository.deleteByIdUserIdAndIdTargetIdAndIdTargetTypeId(userId, targetId, targetType.getId());
    }

    public List<ReactionTypeCountDto> getTop3Reactions(Integer targetId, String targetTypeCode) {
        TargetType targetType = getTargetTypeByCode(targetTypeCode);
        List<Reaction> reactions = reactionRepository
                .findByIdTargetIdAndIdTargetTypeIdAndStatusTrue(targetId, targetType.getId());

        Map<ReactionType, Long> grouped = reactions.stream()
                .collect(Collectors.groupingBy(Reaction::getReactionType, Collectors.counting()));

        return grouped.entrySet().stream()
                .sorted(Map.Entry.<ReactionType, Long>comparingByValue().reversed())
                .limit(3)
                .map(entry -> {
                    ReactionType reactionType = entry.getKey();
                    Long count = entry.getValue();
                    ReactionResponseDto dto = new ReactionResponseDto(reactionType);
                    return new ReactionTypeCountDto(dto, count);
                })
                .toList();
    }

    public List<ReactionType> getAvailableReactionsForMessaging() {
        return reactionTypeRepository.findAll().stream()
                .filter(rt -> Boolean.TRUE.equals(rt.getStatus()))
                .toList();
    }

    public List<ReactionType> getMainReactions() {
        return reactionTypeRepository.findAll().stream()
                .filter(rt -> MAIN_REACTIONS.contains(rt.getName().toLowerCase()))
                .toList();
    }

    public ReactionType getReactionOfUser(Integer userId, Integer targetId, String targetTypeCode) {
        TargetType targetType = getTargetTypeByCode(targetTypeCode);
        Optional<Reaction> reaction = reactionRepository.findByIdUserIdAndIdTargetIdAndIdTargetTypeId(
                userId, targetId, targetType.getId()
        );
        return reaction.map(Reaction::getReactionType).orElse(null);
    }

    private TargetType getTargetTypeByCode(String code) {
        return targetTypeRepository.findByCode(code.trim())
                .orElseThrow(() -> new IllegalArgumentException("Loại đối tượng không hợp lệ: " + code));
    }

    public Map<ReactionType, Long> countAllReactions(Integer targetId, String targetTypeCode) {
        TargetType targetType = getTargetTypeByCode(targetTypeCode);
        List<Reaction> reactions = reactionRepository
                .findByIdTargetIdAndIdTargetTypeIdAndStatusTrue(targetId, targetType.getId());

        return reactions.stream()
                .collect(Collectors.groupingBy(Reaction::getReactionType, Collectors.counting()));
    }

    public List<UserBasicDisplayDto> getUsersByReactionType(Integer targetId, String targetTypeCode, String emojiName) {
        TargetType targetType = getTargetTypeByCode(targetTypeCode);
        ReactionType reactionType = reactionTypeRepository.findByNameIgnoreCase(emojiName)
                .orElseThrow(() -> new IllegalArgumentException("Loại emoji không tồn tại"));

        List<Reaction> reactions = reactionRepository.findByIdTargetIdAndIdTargetTypeIdAndReactionTypeIdAndStatusTrue(
                targetId, targetType.getId(), reactionType.getId()
        );

        return reactions.stream()
                .map(r -> {
                    var user = r.getUser();
                    String avatarUrl = mediaService.getAvatarUrlByUserId(user.getId());
                    return new UserBasicDisplayDto(user.getId(), avatarUrl, user.getDisplayName(), user.getUsername());
                })
                .toList();
    }
}
