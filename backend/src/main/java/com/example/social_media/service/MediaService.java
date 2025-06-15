package com.example.social_media.service;

import com.example.social_media.entity.Media;
import com.example.social_media.entity.MediaType;
import com.example.social_media.entity.TargetType;
import com.example.social_media.entity.User;
import com.example.social_media.repository.MediaRepository;
import com.example.social_media.repository.MediaTypeRepository;
import com.example.social_media.repository.TargetTypeRepository;
import com.example.social_media.repository.UserRepository;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class MediaService {

    private final Storage storage;
    private final MediaRepository mediaRepository;
    private final UserRepository userRepository;
    private final MediaTypeRepository mediaTypeRepository;
    private final TargetTypeRepository targetTypeRepository;

    @Value("${gcs.bucket.name}")
    private String bucketName;

    public MediaService(Storage storage, MediaRepository mediaRepository, UserRepository userRepository,
                        MediaTypeRepository mediaTypeRepository, TargetTypeRepository targetTypeRepository) {
        this.storage = storage;
        this.mediaRepository = mediaRepository;
        this.userRepository = userRepository;
        this.mediaTypeRepository = mediaTypeRepository;
        this.targetTypeRepository = targetTypeRepository;
    }

    public Media uploadMedia(Integer userId, Integer targetId, String targetTypeCode, String mediaTypeName,
                             MultipartFile file, String caption) throws IOException {
        // Xác thực người dùng
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));

        // Lấy targetType
        TargetType targetType = targetTypeRepository.findByCode(targetTypeCode)
                .orElseThrow(() -> new IllegalArgumentException("Loại target không hợp lệ"));

        // Lấy mediaType
        MediaType mediaType = mediaTypeRepository.findByName(mediaTypeName)
                .orElseThrow(() -> new IllegalArgumentException("Loại media không hợp lệ"));

        // Tạo tên file duy nhất
        String fileName = UUID.randomUUID() + "-" + file.getOriginalFilename();
        BlobId blobId = BlobId.of(bucketName, fileName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(file.getContentType())
                .build();

        // Tải file lên GCS
        storage.create(blobInfo, file.getBytes());

        // Tạo URL công khai
        String mediaUrl = String.format("https://storage.googleapis.com/%s/%s", bucketName, fileName);

        // Lưu thông tin vào tblMedia
        Media media = new Media();
        media.setOwner(owner);
        media.setTargetId(targetId);
        media.setTargetType(targetType);
        media.setMediaType(mediaType);
        media.setMediaUrl(mediaUrl);
        media.setCaption(caption);
        media.setCreatedAt(Instant.now()); // Sử dụng Instant thay vì LocalDateTime
        media.setStatus(true);

        return mediaRepository.save(media);
    }

    public List<Media> getMediaByTarget(Integer targetId, String targetTypeCode, String mediaTypeName, Boolean status) {
        TargetType targetType = targetTypeRepository.findByCode(targetTypeCode)
                .orElseThrow(() -> new IllegalArgumentException("Loại target không hợp lệ"));
        MediaType mediaType = mediaTypeRepository.findByName(mediaTypeName)
                .orElseThrow(() -> new IllegalArgumentException("Loại media không hợp lệ"));
        return mediaRepository.findByTargetIdAndTargetTypeIdAndMediaTypeIdAndStatus(
                targetId, targetType.getId(), mediaType.getId(), status);
    }
}