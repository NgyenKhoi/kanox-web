package com.example.social_media.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileUploadService {

    public String uploadFile(MultipartFile file) {
        // TODO: Triển khai logic upload file lên AWS S3 hoặc server
        return "https://placeholder.com/" + file.getOriginalFilename(); // Giả lập URL
    }
}