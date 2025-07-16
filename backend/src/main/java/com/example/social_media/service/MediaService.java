package com.example.social_media.service;

import com.example.social_media.dto.media.MediaDto;
import com.example.social_media.entity.*;
import com.example.social_media.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MediaService {
    private final MediaRepository mediaRepository;
    private final UserRepository userRepository;
    private final MediaTypeRepository mediaTypeRepository;
    private final TargetTypeRepository targetTypeRepository;
    private final GcsService gcsService;
    private final RedisTemplate<String, String> redisAvatarTemplate;
    private final RedisTemplate<String, String> redisMediaTemplate;
    private final ObjectMapper objectMapper;

    private static final Set<String> COMMON_ALLOWED_TYPES = Set.of("image/jpeg", "image/jpg", "video/mp4", "audio/mpeg");
    private static final Set<String> COMMENT_MESSAGE_ALLOWED_TYPES = Set.of("image/jpeg", "image/jpg", "image/gif", "video/mp4", "audio/mpeg");
    private static final Duration CACHE_TTL = Duration.ofMinutes(10);
    private static final Duration AVATAR_CACHE_TTL = Duration.ofMinutes(5);

    public MediaService(MediaRepository mediaRepository, UserRepository userRepository, MediaTypeRepository mediaTypeRepository,
                        TargetTypeRepository targetTypeRepository, GcsService gcsService,
                        RedisTemplate<String, String> redisAvatarTemplate, RedisTemplate<String, String> redisMediaTemplate,
                        ObjectMapper objectMapper) {
        this.mediaRepository = mediaRepository;
        this.userRepository = userRepository;
        this.mediaTypeRepository = mediaTypeRepository;
        this.targetTypeRepository = targetTypeRepository;
        this.gcsService = gcsService;
        this.redisAvatarTemplate = redisAvatarTemplate;
        this.redisMediaTemplate = redisMediaTemplate;
        this.objectMapper = objectMapper;
    }

    public String getFirstMediaUrlByTarget(Integer targetId, String targetTypeCode) {
        Optional<Media> mediaOpt = mediaRepository
                .findFirstByTargetIdAndTargetType_CodeAndMediaType_NameOrderByCreatedAtDesc(
                        targetId, targetTypeCode, "image"
                );
        return mediaOpt.map(Media::getMediaUrl).orElse(null);
    }

    private String buildCacheKey(List<Integer> targetIds, String targetTypeCode, String mediaTypeName) {
        List<Integer> sortedIds = new ArrayList<>(targetIds);
        Collections.sort(sortedIds);
        return String.format("media:%s:%s:%s", sortedIds, targetTypeCode, mediaTypeName);
    }

    public MediaDto uploadMedia(Integer userId, Integer targetId, String targetTypeCode, String mediaTypeName, MultipartFile file, String caption) throws IOException {
        validateFileTypeByTarget(targetTypeCode, file);

        User owner = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        TargetType targetType = targetTypeRepository.findByCode(targetTypeCode).orElseThrow(() -> new IllegalArgumentException("Loại target không hợp lệ"));
        MediaType mediaType = mediaTypeRepository.findByName(mediaTypeName).orElseThrow(() -> new IllegalArgumentException("Loại media không hợp lệ"));
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
        redisAvatarTemplate.delete("avatar:" + userId);
        return toDto(savedMedia);
    }

    public MediaDto saveMediaWithUrl(Integer userId, Integer targetId, String targetTypeCode, String mediaTypeName, String mediaUrl, String caption) {
        User owner = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        TargetType targetType = targetTypeRepository.findByCode(targetTypeCode).orElseThrow(() -> new IllegalArgumentException("Loại target không hợp lệ"));
        MediaType mediaType = mediaTypeRepository.findByName(mediaTypeName).orElseThrow(() -> new IllegalArgumentException("Loại media không hợp lệ"));

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
        TargetType targetType = targetTypeRepository.findByCode(targetTypeCode).orElseThrow(() -> new IllegalArgumentException("Loại target không hợp lệ"));
        MediaType mediaType = mediaTypeRepository.findByName(mediaTypeName).orElseThrow(() -> new IllegalArgumentException("Loại media không hợp lệ"));
        List<Media> mediaList = mediaRepository.findByTargetIdAndTargetTypeIdAndMediaTypeIdAndStatus(
                targetId, targetType.getId(), mediaType.getId(), status);
        return mediaList.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public void disableOldProfileMedia(Integer userId) {
        TargetType targetType = targetTypeRepository.findByCode("PROFILE").orElseThrow(() -> new IllegalArgumentException("Loại target không hợp lệ"));
        MediaType mediaType = mediaTypeRepository.findByName("image").orElseThrow(() -> new IllegalArgumentException("Loại media không hợp lệ"));
        List<Media> oldMedia = mediaRepository.findByTargetIdAndTargetTypeAndMediaTypeAndStatusTrue(userId, targetType, mediaType);
        for (Media media : oldMedia) {
            media.setStatus(false);
        }
        mediaRepository.saveAll(oldMedia);
        redisAvatarTemplate.delete("avatar:" + userId);
    }

    public List<MediaDto> uploadPostMediaFiles(Integer userId, Integer postId, List<MultipartFile> files, String caption) {
        User owner = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        TargetType postTargetType = targetTypeRepository.findByCode("POST").orElseThrow(() -> new IllegalArgumentException("Loại target không hợp lệ"));

        for (MultipartFile file : files) {
            validateFileTypeByTarget("POST", file);
        }

        List<Media> savedMediaList = files.stream().map(file -> {
            String contentType = file.getContentType();
            String mediaTypeName;

            assert contentType != null;
            if (contentType.startsWith("image/")) {
                mediaTypeName = "image";
            } else if (contentType.startsWith("video/")) {
                mediaTypeName = "video";
            } else if (contentType.startsWith("audio/")) {
                mediaTypeName = "audio";
            } else {
                throw new IllegalArgumentException("Không thể xác định loại media.");
            }

            MediaType mediaType = mediaTypeRepository.findByName(mediaTypeName).orElseThrow(() -> new IllegalArgumentException("Loại media không hợp lệ"));

            try {
                String mediaUrl = gcsService.uploadFile(file);

                Media media = new Media();
                media.setOwner(owner);
                media.setTargetId(postId);
                media.setTargetType(postTargetType);
                media.setMediaType(mediaType);
                media.setMediaUrl(mediaUrl);
                media.setCaption(caption);
                media.setCreatedAt(Instant.now());
                media.setStatus(true);

                return media;
            } catch (IOException e) {
                throw new RuntimeException("Lỗi khi upload file: " + file.getOriginalFilename(), e);
            }
        }).collect(Collectors.toList());

        mediaRepository.saveAll(savedMediaList);
        return savedMediaList.stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<MediaDto> uploadMediaFiles(Integer userId, Integer targetId, List<MultipartFile> files, String caption, String targetTypeCode) {
        User owner = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        TargetType targetType = targetTypeRepository.findByCode(targetTypeCode).orElseThrow(() -> new IllegalArgumentException("Loại target không hợp lệ: " + targetTypeCode));

        for (MultipartFile file : files) {
            validateFileTypeByTarget(targetTypeCode, file);
        }

        List<Media> savedMediaList = files.stream().map(file -> {
            String contentType = file.getContentType();
            String mediaTypeName;

            assert contentType != null;
            if (contentType.startsWith("image/")) {
                mediaTypeName = "image";
            } else if (contentType.startsWith("video/")) {
                mediaTypeName = "video";
            } else if (contentType.startsWith("audio/")) {
                mediaTypeName = "audio";
            } else {
                throw new IllegalArgumentException("Không thể xác định loại media.");
            }

            MediaType mediaType = mediaTypeRepository.findByName(mediaTypeName).orElseThrow(() -> new IllegalArgumentException("Loại media không hợp lệ"));

            try {
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

                return media;
            } catch (IOException e) {
                throw new RuntimeException("Lỗi khi upload file: " + file.getOriginalFilename(), e);
            }
        }).collect(Collectors.toList());

        mediaRepository.saveAll(savedMediaList);
        return savedMediaList.stream().map(this::toDto).collect(Collectors.toList());
    }

    public void validateFileTypeByTarget(String targetTypeCode, MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null) {
            throw new IllegalArgumentException("Không xác định được loại file.");
        }

        Set<String> allowedTypes;
        if ("COMMENT".equals(targetTypeCode) || "MESSAGE".equals(targetTypeCode)) {
            allowedTypes = COMMENT_MESSAGE_ALLOWED_TYPES;
        } else {
            allowedTypes = COMMON_ALLOWED_TYPES;
        }

        if (!allowedTypes.contains(contentType)) {
            throw new IllegalArgumentException("Loại file không được hỗ trợ: " + contentType);
        }
    }

    public void deleteMediaById(Integer mediaId) {
        Media media = mediaRepository.findById(mediaId).orElseThrow(() -> new IllegalArgumentException("Media không tồn tại"));
        media.setStatus(false);
        mediaRepository.save(media);
    }

    private MediaDto toDto(Media media) {
        MediaDto dto = new MediaDto();
        dto.setId(media.getId());
        dto.setUrl(media.getMediaUrl());
        dto.setType(media.getMediaType().getName());
        dto.setTargetId(media.getTargetId());
        dto.setTargetType(media.getTargetType().getCode());
        dto.setStatus(media.getStatus());
        return dto;
    }

    public String getAvatarUrlByUserId(Integer userId) {
        String cacheKey = "avatar:" + userId;
        String cachedUrl = redisAvatarTemplate.opsForValue().get(cacheKey);
        if (cachedUrl != null) return cachedUrl;

        Optional<Media> mediaOpt = mediaRepository.findFirstByTargetIdAndTargetType_CodeAndMediaType_NameOrderByCreatedAtDesc(
                userId, "PROFILE", "image"
        );

        String mediaUrl = mediaOpt.map(Media::getMediaUrl).orElse(null);
        if (mediaUrl != null) {
            redisAvatarTemplate.opsForValue().set(cacheKey, mediaUrl, AVATAR_CACHE_TTL);
        }

        return mediaUrl;
    }

    public Map<Integer, List<MediaDto>> getMediaByTargetIds(List<Integer> targetIds, String targetTypeCode, String mediaTypeName, Boolean status) {
        String cacheKey = buildCacheKey(targetIds, targetTypeCode, mediaTypeName);

        try {
            String json = redisMediaTemplate.opsForValue().get(cacheKey);
            if (json != null) {
                List<MediaDto> cachedList = objectMapper.readValue(json, new TypeReference<>() {});
                return cachedList.stream().collect(Collectors.groupingBy(MediaDto::getTargetId));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        TargetType targetType = targetTypeRepository.findByCode(targetTypeCode)
                .orElseThrow(() -> new IllegalArgumentException("Loại target không hợp lệ"));

        List<Media> mediaList;

        // ✅ Nếu mediaTypeName null => lấy tất cả media type
        if (mediaTypeName != null) {
            MediaType mediaType = mediaTypeRepository.findByName(mediaTypeName)
                    .orElseThrow(() -> new IllegalArgumentException("Loại media không hợp lệ"));
            mediaList = mediaRepository.findByTargetIdInAndTargetTypeIdAndMediaTypeIdAndStatus(
                    targetIds, targetType.getId(), mediaType.getId(), status);
        } else {
            mediaList = mediaRepository.findByTargetIdInAndTargetTypeIdAndStatus(
                    targetIds, targetType.getId(), status);
        }

        List<MediaDto> dtoList = mediaList.stream().map(this::toDto).collect(Collectors.toList());

        try {
            redisMediaTemplate.opsForValue().set(cacheKey, objectMapper.writeValueAsString(dtoList), CACHE_TTL);
        } catch (Exception e) {
            e.printStackTrace();
        }

        return dtoList.stream().collect(Collectors.groupingBy(MediaDto::getTargetId));
    }

    public String getGroupAvatarUrl(Integer groupId) {
        String cacheKey = "groupAvatar:" + groupId;
        String cachedUrl = redisAvatarTemplate.opsForValue().get(cacheKey);
        if (cachedUrl != null) return cachedUrl;

        Optional<Media> mediaOpt = mediaRepository
                .findFirstByTargetIdAndTargetType_CodeAndMediaType_NameOrderByCreatedAtDesc(
                        groupId, "GROUP", "image"
                );

        String mediaUrl = mediaOpt.map(Media::getMediaUrl).orElse(null);
        if (mediaUrl != null) {
            redisAvatarTemplate.opsForValue().set(cacheKey, mediaUrl, AVATAR_CACHE_TTL);
        }

        return mediaUrl;
    }

    @Transactional
    public void disableOldGroupMedia(Integer groupId) {
        List<Media> oldAvatars = mediaRepository.findByTargetIdAndTargetTypeCodeAndCaptionAndStatusTrue(
                groupId, "GROUP", "avatar"
        );

        for (Media media : oldAvatars) {
            media.setStatus(false);
        }

        mediaRepository.saveAll(oldAvatars);
    }

}
