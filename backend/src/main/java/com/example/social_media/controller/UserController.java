package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.user.UserProfileDto;
import com.example.social_media.dto.user.UserUpdateProfileDto;
import com.example.social_media.service.UserProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(URLConfig.USER_MANAGEMENT_BASE)
public class UserController {

    private final UserProfileService userProfileService;

    public UserController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    // GET api user profile
    @GetMapping(URLConfig.PROFILE)
    public ResponseEntity<?> getUserProfile(@PathVariable("username") String username) {
        try {
            UserProfileDto userProfileDto = userProfileService.getUserProfile(username);
            return ResponseEntity.ok(userProfileDto);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body("User not found");
        }
    }

    @PutMapping(URLConfig.PROFILE)
    public ResponseEntity<?> updateUserProfile(
            @PathVariable("username") String username,
            @RequestBody UserUpdateProfileDto updateDto) {
        try {
            UserProfileDto updatedProfile = userProfileService.updateUserProfile(username, updateDto);
            return ResponseEntity.ok(updatedProfile);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body("User not found");
        }
    }
}
