package com.example.social_media.service;

import com.example.social_media.dto.media.MediaDto;
import com.example.social_media.entity.Media;
import com.example.social_media.entity.MediaType;
import com.example.social_media.entity.TargetType;
import com.example.social_media.entity.User;
import com.example.social_media.repository.MediaRepository;
import com.example.social_media.repository.MediaTypeRepository;
import com.example.social_media.repository.TargetTypeRepository;
import com.example.social_media.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MediaService {

    private final MediaRepository mediaRepository;
    private final UserRepository userRepository;
    private final MediaTypeRepository mediaTypeRepository;
    private final TargetTypeRepository targetTypeRepository;
    private final GcsService gcsService;

    public MediaService(MediaRepository mediaRepository,
                        UserRepository userRepository,
                        MediaTypeRepository mediaTypeRepository,
                        TargetTypeRepository targetTypeRepository,
                        GcsService gcsService) {
        this.mediaRepository = mediaRepository;
        this.userRepository = userRepository;
        this.mediaTypeRepository = mediaTypeRepository;
        this.targetTypeRepository = targetTypeRepository;
        this.gcsService = gcsService;
    }

    public MediaDto uploadMedia(Integer userId, Integer targetId, String targetTypeCode, String mediaTypeName,
                                MultipartFile file, String caption) throws IOException {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));

        TargetType targetType = targetTypeRepository.findByCode(targetTypeCode)
                .orElseThrow(() -> new IllegalArgumentException("Loại target không hợp lệ"));

        MediaType mediaType = mediaTypeRepository.findByName(mediaTypeName)
                .orElseThrow(() -> new IllegalArgumentException("Loại media không hợp lệ"));

        String mediaUrl = gcsService.uploadFile(file);

        Media media = new Media();
        media.setOwner(owner);
        media.setTargetId(targetId);
        media.setTargetType(targetType);
        media.setMediaType(mediaType);
        media.setMediaUrl(mediaUrl);
        media.setCaption(caption);
        media.setCreatedAt(Instant.now());
        media.setStatus(true);

        Media savedMedia = mediaRepository.save(media);
        return toDto(savedMedia);
    }

    public MediaDto saveMediaWithUrl(Integer userId, Integer targetId, String targetTypeCode, String mediaTypeName,
                                     String mediaUrl, String caption) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));

        TargetType targetType = targetTypeRepository.findByCode(targetTypeCode)
                .orElseThrow(() -> new IllegalArgumentException("Loại target không hợp lệ"));

        MediaType mediaType = mediaTypeRepository.findByName(mediaTypeName)
                .orElseThrow(() -> new IllegalArgumentException("Loại media không hợp lệ"));

        Media media = new Media();
        media.setOwner(owner);
        media.setTargetId(targetId);
        media.setTargetType(targetType);
        media.setMediaType(mediaType);
        media.setMediaUrl(mediaUrl);
        media.setCaption(caption);
        media.setCreatedAt(Instant.now());
        media.setStatus(true);

        Media savedMedia = mediaRepository.save(media);
        return toDto(savedMedia);
    }

    public List<MediaDto> getMediaByTargetDto(Integer targetId, String targetTypeCode, String mediaTypeName, Boolean status) {
        TargetType targetType = targetTypeRepository.findByCode(targetTypeCode)
                .orElseThrow(() -> new IllegalArgumentException("Loại target không hợp lệ"));

        MediaType mediaType = mediaTypeRepository.findByName(mediaTypeName)
                .orElseThrow(() -> new IllegalArgumentException("Loại media không hợp lệ"));

        List<Media> mediaList = mediaRepository.findByTargetIdAndTargetTypeIdAndMediaTypeIdAndStatus(
                targetId, targetType.getId(), mediaType.getId(), status);

        return mediaList.stream().map(this::toDto).collect(Collectors.toList());
    }

    public void updateMedia(Media media) {
        mediaRepository.save(media);
    }

    private MediaDto toDto(Media media) {
        MediaDto dto = new MediaDto();
        dto.setUrl(media.getMediaUrl());
        dto.setType(media.getMediaType().getName());
        dto.setTargetType(media.getTargetType().getCode());
        dto.setStatus(media.getStatus());
        return dto;
    }
}
