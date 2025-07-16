package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.reaction.ReactionRequestDto;
import com.example.social_media.dto.reaction.ReactionResponseDto;
import com.example.social_media.dto.reaction.ReactionTypeCountDto;
import com.example.social_media.dto.reaction.RemoveReactionRequestDto;
import com.example.social_media.dto.user.UserBasicDisplayDto;
import com.example.social_media.dto.user.UserDto;
import com.example.social_media.entity.ReactionType;
import com.example.social_media.service.ReactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(URLConfig.REACTION_BASE)
public class ReactionController {

    private final ReactionService reactionService;

    public ReactionController(ReactionService reactionService) {
        this.reactionService = reactionService;
    }
    

    @GetMapping(URLConfig.GET_TOP_REACTION)
    public ResponseEntity<List<ReactionTypeCountDto>> getTop3Reactions(
            @RequestParam Integer targetId,
            @RequestParam String targetTypeCode
    ) {
        return ResponseEntity.ok(reactionService.getTop3Reactions(targetId, targetTypeCode));
    }

    @GetMapping(URLConfig.COUNT_REACTION)
    public ResponseEntity<Map<ReactionType, Long>> countAllReactions(
            @RequestParam Integer targetId,
            @RequestParam String targetTypeCode
    ) {
        return ResponseEntity.ok(reactionService.countAllReactions(targetId, targetTypeCode));
    }

    @GetMapping(URLConfig.GET_REACTION_FOR_MESSAGE)
    public ResponseEntity<List<Map<String, String>>> getReactionsForMessaging() {
        List<ReactionType> types = reactionService.getAvailableReactionsForMessaging();

        List<Map<String, String>> result = types.stream()
                .map(rt -> Map.of(
                        "name", rt.getName(),
                        "emoji", rt.getEmoji()
                ))
                .toList();

        return ResponseEntity.ok(result);
    }

    @PostMapping(URLConfig.ADD_REACTION_BY_NAME)
    public ResponseEntity<Void> addReactionByName(@RequestBody ReactionRequestDto dto) {
        reactionService.addOrUpdateReaction(
                dto.getUserId(),
                dto.getTargetId(),
                dto.getTargetTypeCode(),
                dto.getEmojiName()
        );
        return ResponseEntity.ok().build();
    }

    @DeleteMapping(URLConfig.REMOVE_REACTION_BY_NAME)
    public ResponseEntity<Void> removeReactionByName(
            @RequestParam Integer userId,
            @RequestParam Integer targetId,
            @RequestParam String targetTypeCode
    ) {
        reactionService.removeReaction(userId, targetId, targetTypeCode);
        return ResponseEntity.ok().build();
    }


    @GetMapping(URLConfig.EMOJI_MAIN_LIST)
    public ResponseEntity<List<Map<String, String>>> getMainEmojiList() {
        List<ReactionType> types = reactionService.getMainReactions();

        List<Map<String, String>> result = types.stream()
                .map(rt -> Map.of("name", rt.getName(), "emoji", rt.getEmoji()))
                .toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping(URLConfig.GET_REACTION_BY_USER)
    public ResponseEntity<?> getUserReaction(
            @RequestParam Integer userId,
            @RequestParam Integer targetId,
            @RequestParam String targetTypeCode
    ) {
        ReactionType reaction = reactionService.getReactionOfUser(userId, targetId, targetTypeCode);

        if (reaction == null) {
            return ResponseEntity.ok().body(null); // chưa thả cảm xúc
        }

        return ResponseEntity.ok(new ReactionResponseDto(reaction));
    }

    @GetMapping(URLConfig.LIST_REACTION_BY_TYPE)
    public ResponseEntity<List<UserBasicDisplayDto>> getUsersByReactionType(
            @RequestParam Integer targetId,
            @RequestParam String targetTypeCode,
            @RequestParam String emojiName
    ) {
        List<UserBasicDisplayDto> users = reactionService.getUsersByReactionType(targetId, targetTypeCode, emojiName);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getReactionSummary(
            @RequestParam Integer targetId,
            @RequestParam String targetTypeCode
    ) {
        Map<String, Object> result = new HashMap<>();

        Map<ReactionType, Long> countMap = reactionService.countAllReactions(targetId, targetTypeCode);
        List<ReactionTypeCountDto> top3 = reactionService.getTop3Reactions(targetId, targetTypeCode);

        result.put("countMap", countMap);
        result.put("topReactions", top3);

        return ResponseEntity.ok(result);
    }
}
