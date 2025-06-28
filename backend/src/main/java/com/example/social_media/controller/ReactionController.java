package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.reaction.ReactionRequestDto;
import com.example.social_media.dto.reaction.ReactionTypeCountDto;
import com.example.social_media.dto.reaction.RemoveReactionRequestDto;
import com.example.social_media.entity.ReactionType;
import com.example.social_media.service.ReactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(URLConfig.REACTION_BASE)
public class ReactionController {

    private final ReactionService reactionService;

    public ReactionController(ReactionService reactionService) {
        this.reactionService = reactionService;
    }

    // ✅ Sử dụng targetTypeCode và emojiName (kiểu String)
    @PostMapping(URLConfig.ADD_REACTION)
    public ResponseEntity<Void> addReaction(
            @RequestParam Integer userId,
            @RequestParam Integer targetId,
            @RequestParam String targetTypeCode,
            @RequestParam String emojiName
    ) {
        reactionService.addOrUpdateReaction(userId, targetId, targetTypeCode, emojiName);
        return ResponseEntity.ok().build();
    }

    // ✅ Sử dụng targetTypeCode (kiểu String)
    @DeleteMapping(URLConfig.REMOVE_REACTION)
    public ResponseEntity<Void> removeReaction(
            @RequestParam Integer userId,
            @RequestParam Integer targetId,
            @RequestParam String targetTypeCode
    ) {
        reactionService.removeReaction(userId, targetId, targetTypeCode);
        return ResponseEntity.ok().build();
    }

    // Không cần sửa vì dùng targetTypeId (Integer) cho các hàm thống kê
    @GetMapping(URLConfig.GET_TOP_REACTION)
    public ResponseEntity<List<ReactionTypeCountDto>> getTop3Reactions(
            @RequestParam Integer targetId,
            @RequestParam Integer targetTypeId
    ) {
        return ResponseEntity.ok(reactionService.getTop3Reactions(targetId, targetTypeId));
    }

    @GetMapping(URLConfig.COUNT_REACTION)
    public ResponseEntity<Map<ReactionType, Long>> countAllReactions(
            @RequestParam Integer targetId,
            @RequestParam Integer targetTypeId
    ) {
        return ResponseEntity.ok(reactionService.countAllReactions(targetId, targetTypeId));
    }

    @GetMapping(URLConfig.GET_REACTION_FOR_MESSAGE)
    public ResponseEntity<List<ReactionType>> getReactionsForMessaging() {
        return ResponseEntity.ok(reactionService.getAvailableReactionsForMessaging());
    }

    @GetMapping(URLConfig.GET_MAIN_REACTION)
    public ResponseEntity<List<ReactionType>> getMainReactions() {
        return ResponseEntity.ok(reactionService.getMainReactions());
    }

    // Đã đúng sẵn: sử dụng DTO chứa targetTypeCode và emojiName
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
    public ResponseEntity<Void> removeReactionByName(@RequestBody RemoveReactionRequestDto dto) {
        reactionService.removeReaction(dto.getUserId(), dto.getTargetId(), dto.getTargetTypeCode());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/emoji-main-list")
    public ResponseEntity<List<Map<String, String>>> getMainEmojiList() {
        List<ReactionType> types = reactionService.getMainReactions();

        List<Map<String, String>> result = types.stream()
                .map(rt -> Map.of("name", rt.getName(), "emoji", rt.getEmoji()))
                .toList();

        return ResponseEntity.ok(result);
    }
}
