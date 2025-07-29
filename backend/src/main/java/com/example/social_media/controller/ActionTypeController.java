package com.example.social_media.controller;

import com.example.social_media.entity.ActionType;
import com.example.social_media.repository.ActionTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/action-types")
public class ActionTypeController {

    @Autowired
    private ActionTypeRepository actionTypeRepository;

    @GetMapping("/check-duplicates")
    public ResponseEntity<?> checkDuplicates() {
        try {
            List<ActionType> lockUsers = actionTypeRepository.findAllByName("LOCK_USER");
            List<ActionType> unlockUsers = actionTypeRepository.findAllByName("UNLOCK_USER");
            
            return ResponseEntity.ok(Map.of(
                "message", "Duplicate check completed",
                "lockUserCount", lockUsers.size(),
                "unlockUserCount", unlockUsers.size(),
                "lockUsers", lockUsers,
                "unlockUsers", unlockUsers
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "message", "Error checking duplicates",
                "error", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/cleanup-duplicates")
    public ResponseEntity<?> cleanupDuplicates() {
        try {
            // Delete specific duplicate IDs
            actionTypeRepository.deleteById(37);
            actionTypeRepository.deleteById(38);
            
            return ResponseEntity.ok(Map.of(
                "message", "Duplicate ActionTypes cleaned up successfully",
                "deletedIds", List.of(37, 38)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "message", "Error cleaning up duplicates",
                "error", e.getMessage()
            ));
        }
    }
    

}