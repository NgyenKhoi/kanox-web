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
    public ResponseEntity<MediaDto> uploadMedia(
            @RequestParam("userId") Integer userId,
            @RequestParam("targetId") Integer targetId,
            @RequestParam("targetTypeCode") String targetTypeCode,
            @RequestParam("mediaTypeName") String mediaTypeName,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption) throws IOException {
        MediaDto mediaDto = mediaService.uploadMedia(userId, targetId, targetTypeCode, mediaTypeName, file, caption);
        return new ResponseEntity<>(mediaDto, HttpStatus.CREATED);
    }

    @GetMapping(URLConfig.GET_MEDIA_BY_TARGET)
    public ResponseEntity<List<MediaDto>> getMediaByTarget(
            @RequestParam("targetId") Integer targetId,
            @RequestParam("targetTypeCode") String targetTypeCode,
            @RequestParam("mediaTypeName") String mediaTypeName,
            @RequestParam(value = "status", defaultValue = "true") Boolean status) {
        List<MediaDto> mediaList = mediaService.getMediaByTargetDto(targetId, targetTypeCode, mediaTypeName, status);
        return ResponseEntity.ok(mediaList);
    }

    @PostMapping(URLConfig.MEDIA_FOR_POST)
    public ResponseEntity<List<MediaDto>> uploadPostMedia(
            @PathVariable Integer postId,
            @RequestParam("userId") Integer userId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "caption", required = false) String caption) throws IOException {
        List<MediaDto> uploaded = mediaService.uploadPostMedia(userId, postId, files, caption);
        return ResponseEntity.ok(uploaded);
    }
}
