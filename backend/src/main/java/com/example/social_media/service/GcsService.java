package com.example.social_media.service;

import org.springframework.beans.factory.annotation.Value;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.UUID;
import com.google.cloud.storage.Storage;
@Service
public class GcsService {

    @Value("${gcs.bucket.name}")
    private String bucketName;

    private final Storage storage;
    private static final String FORMAT_URL_UPLOAD = "https://storage.googleapis.com/%s/%s";

    public GcsService(Storage storage) {
        this.storage = storage;
    }

    public String uploadFile(MultipartFile file) throws IOException {
        String objectName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        BlobId blobId = BlobId.of(bucketName, objectName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType(file.getContentType()).build();
        storage.create(blobInfo, file.getBytes());
        return String.format(FORMAT_URL_UPLOAD, bucketName, objectName);
    }
}
