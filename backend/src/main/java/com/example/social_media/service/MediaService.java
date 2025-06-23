package com.example.social_media.service;

import com.example.social_media.dto.media.MediaDto;
import com.example.social_media.entity.*;
import com.example.social_media.repository.*;
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
        private final RedisTemplate<String, List<MediaDto>> redisTemplate;

        private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
                        "image/jpeg", "image/jpg",
                        "video/mp4",
                        "audio/mpeg");

        private static final Duration CACHE_TTL = Duration.ofMinutes(10);

        public MediaService(MediaRepository mediaRepository,
                        UserRepository userRepository,
                        MediaTypeRepository mediaTypeRepository,
                        TargetTypeRepository targetTypeRepository,
                        GcsService gcsService,
                        RedisTemplate<String, List<MediaDto>> redisTemplate) {
                this.mediaRepository = mediaRepository;
                this.userRepository = userRepository;
                this.mediaTypeRepository = mediaTypeRepository;
                this.targetTypeRepository = targetTypeRepository;
                this.gcsService = gcsService;
                this.redisTemplate = redisTemplate;
        }

        private String buildCacheKey(List<Integer> targetIds, String targetTypeCode, String mediaTypeName) {
                List<Integer> sortedIds = new ArrayList<>(targetIds);
                Collections.sort(sortedIds);
                return String.format("media:%s:%s:%s", sortedIds.toString(), targetTypeCode, mediaTypeName);
        }

        public MediaDto uploadMedia(Integer userId, Integer targetId, String targetTypeCode, String mediaTypeName,
                        MultipartFile file, String caption) throws IOException {
                validateFileType(file);

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

        public List<MediaDto> getMediaByTargetDto(Integer targetId, String targetTypeCode, String mediaTypeName,
                        Boolean status) {
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

        @Transactional
        public void disableOldProfileMedia(Integer userId) {
                TargetType targetType = targetTypeRepository.findByCode("PROFILE")
                                .orElseThrow(() -> new IllegalArgumentException("Loại target không hợp lệ"));
                MediaType mediaType = mediaTypeRepository.findByName("image")
                                .orElseThrow(() -> new IllegalArgumentException("Loại media không hợp lệ"));

                List<Media> oldMedia = mediaRepository.findByTargetIdAndTargetTypeAndMediaTypeAndStatusTrue(userId,
                                targetType, mediaType);
                for (Media media : oldMedia) {
                        media.setStatus(false);
                }
                mediaRepository.saveAll(oldMedia);
        }

        public List<MediaDto> uploadPostMediaFiles(Integer userId,
                        Integer postId,
                        List<MultipartFile> files,
                        String caption) throws IOException {
                User owner = userRepository.findById(userId)
                                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));

                TargetType postTargetType = targetTypeRepository.findByCode("POST")
                                .orElseThrow(() -> new IllegalArgumentException("Loại target không hợp lệ"));

                for (MultipartFile file : files) {
                        String contentType = file.getContentType();
                        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
                                throw new IllegalArgumentException("File \"" + file.getOriginalFilename()
                                                + "\" không hợp lệ. Vui lòng chọn lại file.");
                        }
                }

                List<Media> savedMediaList = files.stream().map(file -> {
                        String contentType = file.getContentType();
                        String mediaTypeName;

                        if (contentType.startsWith("image/")) {
                                mediaTypeName = "image";
                        } else if (contentType.startsWith("video/")) {
                                mediaTypeName = "video";
                        } else if (contentType.startsWith("audio/")) {
                                mediaTypeName = "audio";
                        } else {
                                throw new IllegalArgumentException("Không thể xác định loại media."); // fallback
                        }

                        MediaType mediaType = mediaTypeRepository.findByName(mediaTypeName)
                                        .orElseThrow(() -> new IllegalArgumentException("Loại media không hợp lệ"));

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

        public void deleteMediaById(Integer mediaId) {
                Media media = mediaRepository.findById(mediaId)
                                .orElseThrow(() -> new IllegalArgumentException("Media không tồn tại"));
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

        private void validateFileType(MultipartFile file) {
                String contentType = file.getContentType();
                if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
                        throw new IllegalArgumentException("Loại file không được hỗ trợ: " + contentType);
                }
        }

        public List<MediaDto> getMediaByTargetIds(List<Integer> targetIds, String targetTypeCode, String mediaTypeName,
                        Boolean status) {
                String cacheKey = buildCacheKey(targetIds, targetTypeCode, mediaTypeName);

                List<MediaDto> cached = redisTemplate.opsForValue().get(cacheKey);
                if (cached != null)
                        return cached;

                TargetType targetType = targetTypeRepository.findByCode(targetTypeCode)
                                .orElseThrow(() -> new IllegalArgumentException("Loại target không hợp lệ"));

                MediaType mediaType = mediaTypeRepository.findByName(mediaTypeName)
                                .orElseThrow(() -> new IllegalArgumentException("Loại media không hợp lệ"));

                List<Media> mediaList = mediaRepository.findByTargetIdInAndTargetTypeIdAndMediaTypeIdAndStatus(
                                targetIds, targetType.getId(), mediaType.getId(), status);

                List<MediaDto> dtoList = mediaList.stream().map(this::toDto).collect(Collectors.toList());
                redisTemplate.opsForValue().set(cacheKey, dtoList, CACHE_TTL);
                return dtoList;
        }
}
