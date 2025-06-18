package com.example.social_media.service;

import com.google.cloud.storage.Acl;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.UUID;

@Service
public class GcsService {

    private static final Logger logger = LoggerFactory.getLogger(GcsService.class);

    @Value("${gcs.bucket.name}")
    private String bucketName;

    private final Storage storage;
    private static final String FORMAT_URL_UPLOAD = "https://storage.googleapis.com/%s/%s";

    public GcsService(Storage storage) {
        this.storage = storage;
    }

    public String uploadFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            logger.error("File is empty");
            throw new IllegalArgumentException("File không được để trống");
        }

        String objectName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        logger.info("Uploading file to GCS: bucket={}, objectName={}", bucketName, objectName);

        BlobId blobId = BlobId.of(bucketName, objectName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(file.getContentType())
                .setAcl(Arrays.asList(Acl.of(Acl.User.ofAllUsers(), Acl.Role.READER)))
                .build();

        try {
            storage.create(blobInfo, file.getBytes());
            String fileUrl = String.format(FORMAT_URL_UPLOAD, bucketName, objectName);
            logger.info("File uploaded successfully: url={}", fileUrl);
            return fileUrl;
        } catch (Exception e) {
            logger.error("Failed to upload file to GCS: {}", e.getMessage());
            throw new IOException("Không thể tải file lên GCS: " + e.getMessage(), e);
        }
    }
}
