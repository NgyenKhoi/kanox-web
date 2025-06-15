package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.entity.Media;
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
    public ResponseEntity<Media> uploadMedia(
            @RequestParam("userId") Integer userId,
            @RequestParam("targetId") Integer targetId,
            @RequestParam("targetTypeCode") String targetTypeCode,
            @RequestParam("mediaTypeName") String mediaTypeName,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption) {
        try {
            Media media = mediaService.uploadMedia(userId, targetId, targetTypeCode, mediaTypeName, file, caption);
            return new ResponseEntity<>(media, HttpStatus.CREATED);
        } catch (IOException e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping(URLConfig.GET_MEDIA_BY_TARGET)
    public ResponseEntity<List<Media>> getMediaByTarget(
            @RequestParam("targetId") Integer targetId,
            @RequestParam("targetTypeCode") String targetTypeCode,
            @RequestParam("mediaTypeName") String mediaTypeName,
            @RequestParam(value = "status", defaultValue = "true") Boolean status) {
        try {
            List<Media> mediaList = mediaService.getMediaByTarget(targetId, targetTypeCode, mediaTypeName, status);
            return new ResponseEntity<>(mediaList, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        }
    }
}