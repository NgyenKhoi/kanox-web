package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.service.FileUploadService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping(URLConfig.UPLOAD_BASE)
public class UploadController {

    private final FileUploadService fileUploadService;

    public UploadController(FileUploadService fileUploadService) {
        this.fileUploadService = fileUploadService;
    }

    @PostMapping
    public ResponseEntity<?> uploadFiles(@RequestParam("files") MultipartFile[] files) {
        try {
            List<String> urls = new ArrayList<>();
            for (MultipartFile file : files) {
                String url = fileUploadService.uploadFile(file);
                urls.add(url);
            }
            return ResponseEntity.ok(urls);
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }
}