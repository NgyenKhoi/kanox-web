package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.ReactionTypeCountDto;
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

    @PostMapping(URLConfig.ADD_REACTION)
    public ResponseEntity<Void> addReaction(
            @RequestParam Integer userId,
            @RequestParam Integer targetId,
            @RequestParam Integer targetTypeId,
            @RequestParam Integer reactionTypeId
    ) {
        reactionService.addOrUpdateReaction(userId, targetId, targetTypeId, reactionTypeId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping(URLConfig.REMOVE_REACTION)
    public ResponseEntity<Void> removeReaction(
            @RequestParam Integer userId,
            @RequestParam Integer targetId,
            @RequestParam Integer targetTypeId
    ) {
        reactionService.removeReaction(userId, targetId, targetTypeId);
        return ResponseEntity.ok().build();
    }

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
}
