package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.media.MediaDto;
import com.example.social_media.service.MediaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping(URLConfig.MEDIA_BASE)
public class MediaController {

    private final MediaService mediaService;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @PostMapping(URLConfig.MEDIA_UPLOAD)
    public ResponseEntity<?> uploadMedia(
            @RequestParam("userId") Integer userId,
            @RequestParam("targetId") Integer targetId,
            @RequestParam("targetTypeCode") String targetTypeCode,
            @RequestParam("mediaTypeName") String mediaTypeName,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption) {
        try {
            MediaDto mediaDto = mediaService.uploadMedia(userId, targetId, targetTypeCode, mediaTypeName, file,
                    caption);
            return new ResponseEntity<>(mediaDto, HttpStatus.CREATED);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload media: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body("Invalid request: " + e.getMessage());
        }
    }

    @GetMapping(URLConfig.GET_MEDIA_BY_TARGET)
    public ResponseEntity<?> getMediaByTarget(
            @RequestParam("targetId") Integer targetId,
            @RequestParam("targetTypeCode") String targetTypeCode,
            @RequestParam("mediaTypeName") String mediaTypeName,
            @RequestParam(value = "status", defaultValue = "true") Boolean status) {
        try {
            List<MediaDto> mediaList = mediaService.getMediaByTargetDto(targetId, targetTypeCode, mediaTypeName,
                    status);
            return ResponseEntity.ok(mediaList);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid request: " + e.getMessage());
        }
    }

    @PostMapping(URLConfig.MEDIA_FOR_POST)
    public ResponseEntity<List<MediaDto>> uploadPostMedia(
            @RequestParam Integer userId,
            @PathVariable Integer postId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(required = false) String caption) throws IOException {
        List<MediaDto> mediaList = mediaService.uploadPostMediaFiles(userId, postId, files, caption);
        return ResponseEntity.ok(mediaList);
    }

    @DeleteMapping(URLConfig.DELETE_MEDIA)
    public ResponseEntity<?> deleteMedia(@PathVariable Integer mediaId) {
        try {
            mediaService.deleteMediaById(mediaId);
            return ResponseEntity.ok("Media deleted successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/targets")
    public ResponseEntity<?> getMediaByTargets(
            @RequestParam("targetIds") List<Integer> targetIds,
            @RequestParam("targetTypeCode") String targetTypeCode,
            @RequestParam("mediaTypeName") String mediaTypeName,
            @RequestParam(value = "status", defaultValue = "true") Boolean status) {
        try {
            List<MediaDto> mediaList = mediaService.getMediaByTargetIds(targetIds, targetTypeCode, mediaTypeName,
                    status);
            return ResponseEntity.ok(mediaList);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid request: " + e.getMessage());
        }
    }
}