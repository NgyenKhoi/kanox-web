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
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReactionService {

    private final ReactionRepository reactionRepository;
    private final ReactionTypeRepository reactionTypeRepository;
    private final UserRepository userRepository;
    private final TargetTypeRepository targetTypeRepository;
    private final MediaService mediaService;
    private final RedisTemplate<String, Object> redisReactionTemplate;

    private static final Set<String> MAIN_REACTIONS = Set.of("like", "love", "smile", "sad", "wow", "angry", "sleepy");
    private static final Duration CACHE_TTL = Duration.ofMinutes(5);

    public ReactionService(ReactionRepository reactionRepository,
                           ReactionTypeRepository reactionTypeRepository,
                           UserRepository userRepository,
                           TargetTypeRepository targetTypeRepository,
                           MediaService mediaService,
                           RedisTemplate<String, Object> redisReactionTemplate) {
        this.reactionRepository = reactionRepository;
        this.reactionTypeRepository = reactionTypeRepository;
        this.userRepository = userRepository;
        this.targetTypeRepository = targetTypeRepository;
        this.mediaService = mediaService;
        this.redisReactionTemplate = redisReactionTemplate;
    }

    public void addOrUpdateReaction(Integer userId, Integer targetId, String targetTypeCode, String emojiName) {
        TargetType targetType = getTargetTypeByCode(targetTypeCode);
        ReactionType reactionType = reactionTypeRepository.findByNameIgnoreCase(emojiName.trim())
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

        clearCache(targetId, targetTypeCode);
    }
    @Transactional
    public void removeReaction(Integer userId, Integer targetId, String targetTypeCode) {
        TargetType targetType = getTargetTypeByCode(targetTypeCode);
        reactionRepository.deleteByIdUserIdAndIdTargetIdAndIdTargetTypeId(userId, targetId, targetType.getId());
        clearCache(targetId, targetTypeCode);
    }

    public List<ReactionTypeCountDto> getTop3Reactions(Integer targetId, String targetTypeCode) {
        String cacheKey = String.format("reaction:top3:%s:%d", targetTypeCode, targetId);
        List<ReactionTypeCountDto> cached = (List<ReactionTypeCountDto>) redisReactionTemplate.opsForValue().get(cacheKey);
        if (cached != null) return cached;

        TargetType targetType = getTargetTypeByCode(targetTypeCode);
        List<Reaction> reactions = reactionRepository.findById_TargetIdAndId_TargetTypeIdAndStatusTrue(targetId, targetType.getId());

        Map<ReactionType, Long> grouped = reactions.stream()
                .collect(Collectors.groupingBy(Reaction::getReactionType, Collectors.counting()));

        List<ReactionTypeCountDto> result = grouped.entrySet().stream()
                .sorted(Map.Entry.<ReactionType, Long>comparingByValue().reversed())
                .limit(3)
                .map(entry -> new ReactionTypeCountDto(new ReactionResponseDto(entry.getKey()), entry.getValue()))
                .toList();

        redisReactionTemplate.opsForValue().set(cacheKey, result, CACHE_TTL);
        return result;
    }

    public Map<ReactionType, Long> countAllReactions(Integer targetId, String targetTypeCode) {
        TargetType targetType = getTargetTypeByCode(targetTypeCode);
        List<Reaction> reactions = reactionRepository.findById_TargetIdAndId_TargetTypeIdAndStatusTrue(targetId, targetType.getId());
        return reactions.stream().collect(Collectors.groupingBy(Reaction::getReactionType, Collectors.counting()));
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
        Optional<Reaction> reaction = reactionRepository.findByIdUserIdAndIdTargetIdAndIdTargetTypeId(userId, targetId, targetType.getId());
        return reaction.map(Reaction::getReactionType).orElse(null);
    }

    public List<UserBasicDisplayDto> getUsersByReactionType(Integer targetId, String targetTypeCode, String emojiName) {
        TargetType targetType = getTargetTypeByCode(targetTypeCode);
        ReactionType reactionType = reactionTypeRepository.findByNameIgnoreCase(emojiName)
                .orElseThrow(() -> new IllegalArgumentException("Loại emoji không tồn tại"));

        List<Reaction> reactions = reactionRepository.findByIdTargetIdAndIdTargetTypeIdAndReactionTypeIdAndStatusTrue(
                targetId, targetType.getId(), reactionType.getId());

        return reactions.stream()
                .map(r -> new UserBasicDisplayDto(
                        r.getUser().getId(),
                        r.getUser().getDisplayName(),
                        r.getUser().getUsername(),
                        mediaService.getAvatarUrlByUserId(r.getUser().getId())
                )).toList();
    }

    private TargetType getTargetTypeByCode(String code) {
        return targetTypeRepository.findByCode(code.trim())
                .orElseThrow(() -> new IllegalArgumentException("Loại đối tượng không hợp lệ: " + code));
    }

    private void clearCache(Integer targetId, String targetTypeCode) {
        redisReactionTemplate.delete(String.format("reaction:top3:%s:%d", targetTypeCode, targetId));
    }

    public Map<Integer, Map<ReactionType, Long>> countAllReactionsBatch(List<Integer> targetIds, String targetTypeCode) {
        List<Object[]> rows = reactionRepository.countAllByTargetIdsAndType(targetIds, targetTypeCode);

        Map<Integer, Map<ReactionType, Long>> result = new HashMap<>();
        for (Object[] row : rows) {
            Integer targetId = (Integer) row[0];
            String reactionName = (String) row[1];
            Long count = (Long) row[2];

            ReactionType type = reactionTypeRepository.findByNameIgnoreCase(reactionName)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy ReactionType: " + reactionName));

            result.computeIfAbsent(targetId, k -> new HashMap<>()).put(type, count);
        }

        return result;
    }
}
