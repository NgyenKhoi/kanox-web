package com.example.social_media.service;

import com.example.social_media.dto.post.PostRequestDto;
import com.example.social_media.dto.post.PostResponseDto;
import com.example.social_media.dto.user.UserTagDto;
import com.example.social_media.entity.ContentPrivacy;
import com.example.social_media.entity.ContentPrivacyId;
import com.example.social_media.entity.CustomPrivacyList;
import com.example.social_media.entity.Post;
import com.example.social_media.entity.PostTag;
import com.example.social_media.exception.RegistrationException;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.exception.UnauthorizedException;
import com.example.social_media.repository.ContentPrivacyRepository;
import com.example.social_media.repository.CustomPrivacyListRepository;
import com.example.social_media.repository.PostRepository;
import com.example.social_media.repository.PostTagRepository;
import com.example.social_media.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PostService {
    private static final Logger logger = LoggerFactory.getLogger(PostService.class);

    private final PostRepository postRepository;
    private final PostTagRepository postTagRepository;
    private final UserRepository userRepository;
    private final ContentPrivacyRepository contentPrivacyRepository;
    private final CustomPrivacyListRepository customPrivacyListRepository;
    private final PrivacyService privacyService;

    public PostService(PostRepository postRepository, PostTagRepository postTagRepository,
                       UserRepository userRepository, ContentPrivacyRepository contentPrivacyRepository,
                       CustomPrivacyListRepository customPrivacyListRepository, PrivacyService privacyService) {
        this.postRepository = postRepository;
        this.postTagRepository = postTagRepository;
        this.userRepository = userRepository;
        this.contentPrivacyRepository = contentPrivacyRepository;
        this.customPrivacyListRepository = customPrivacyListRepository;
        this.privacyService = privacyService;
    }

    @Transactional
    public PostResponseDto createPost(PostRequestDto dto, String username) {
        logger.info("Creating post for user: {}", username);
        logger.debug("PostRequestDto: {}", dto);

        var user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("User not found or inactive"));

        String privacySetting = dto.getPrivacySetting() != null ? dto.getPrivacySetting() :
                privacyService.getPrivacySettingByUserId(user.getId()).getPostViewer();

        // Normalize privacySetting: map 'private' to 'only_me'
        if ("private".equals(privacySetting)) {
            privacySetting = "only_me";
        }

        // Validate privacySetting
        if (!List.of("public", "friends", "only_me", "custom").contains(privacySetting)) {
            throw new IllegalArgumentException("Invalid privacy setting: " + privacySetting);
        }

        // Validate and fetch CustomPrivacyList if privacySetting is 'custom'
        CustomPrivacyList customList = null;
        Integer customListId = dto.getCustomListId();
        if ("custom".equals(privacySetting)) {
            if (customListId == null) {
                throw new IllegalArgumentException("Custom list ID is required for custom privacy setting");
            }
            customList = customPrivacyListRepository.findByIdAndStatus(customListId, true)
                    .orElseThrow(() -> new IllegalArgumentException("Custom list not found with id: " + customListId));
        }

        String taggedUserIds = dto.getTaggedUserIds() != null ?
                String.join(",", dto.getTaggedUserIds().stream().map(String::valueOf).toList()) : null;

        Integer newPostId = postRepository.createPost(
                user.getId(), dto.getContent(), privacySetting, null, taggedUserIds, customListId);

        if (newPostId == null) {
            throw new RegistrationException("Failed to create post");
        }

        Post latestPost = postRepository.findById(newPostId)
                .orElseThrow(() -> new RegistrationException("Post creation failed - not found"));

        // Tạo ContentPrivacy cho post mới
        ContentPrivacy contentPrivacy = new ContentPrivacy();
        ContentPrivacyId id = new ContentPrivacyId();
        id.setContentId(newPostId);
        id.setContentTypeId(1); // Giả định content_type_id = 1 cho tblPost
        contentPrivacy.setId(id);
        contentPrivacy.setPrivacySetting(privacySetting);
        contentPrivacy.setCustomList(customList);
        contentPrivacy.setStatus(true);
        contentPrivacyRepository.save(contentPrivacy);

        return convertToDto(latestPost);
    }

    @Transactional
    public PostResponseDto updatePost(Integer postId, PostRequestDto dto, String username) {
        logger.info("Updating post {} for user: {}", postId, username);
        logger.debug("PostRequestDto: {}", dto);

        var user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("User not found or inactive"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new UserNotFoundException("Post not found"));

        if (!post.getOwner().getId().equals(user.getId())) {
            throw new UnauthorizedException("You are not authorized to update this post");
        }

        // Lấy post_viewer từ tblPrivacySettings nếu privacySetting không được chỉ định
        String privacySetting = dto.getPrivacySetting() != null ? dto.getPrivacySetting() :
                privacyService.getPrivacySettingByUserId(user.getId()).getPostViewer();

        // Normalize privacySetting: map 'private' to 'only_me'
        if ("private".equals(privacySetting)) {
            privacySetting = "only_me";
        }

        // Validate privacySetting
        if (!List.of("public", "friends", "only_me", "custom").contains(privacySetting)) {
            throw new IllegalArgumentException("Invalid privacy setting: " + privacySetting);
        }

        // Validate and fetch CustomPrivacyList if privacySetting is 'custom'
        CustomPrivacyList customList = null;
        Integer customListId = dto.getCustomListId();
        if ("custom".equals(privacySetting)) {
            if (customListId == null) {
                throw new IllegalArgumentException("Custom list ID is required for custom privacy setting");
            }
            customList = customPrivacyListRepository.findByIdAndStatus(customListId, true)
                    .orElseThrow(() -> new IllegalArgumentException("Custom list not found with id: " + customListId));
        }

        // Update ContentPrivacy
        ContentPrivacy existingPrivacy = contentPrivacyRepository.findByContentIdAndContentTypeId(postId, 1)
                .orElseGet(() -> {
                    ContentPrivacy newPrivacy = new ContentPrivacy();
                    ContentPrivacyId id = new ContentPrivacyId();
                    id.setContentId(postId);
                    id.setContentTypeId(1);
                    newPrivacy.setId(id);
                    newPrivacy.setStatus(true);
                    return newPrivacy;
                });
        existingPrivacy.setPrivacySetting(privacySetting);
        existingPrivacy.setCustomList(customList);
        contentPrivacyRepository.save(existingPrivacy);

        // Update post
        post.setContent(dto.getContent());
        post.setPrivacySetting(privacySetting);
        postRepository.save(post);

        // Update tags
        postTagRepository.deleteByPostId(postId);
        if (dto.getTaggedUserIds() != null) {
            for (Integer taggedUserId : dto.getTaggedUserIds()) {
                var taggedUser = userRepository.findById(taggedUserId)
                        .orElseThrow(() -> new UserNotFoundException("Tagged user not found: " + taggedUserId));
                PostTag postTag = new PostTag();
                postTag.setPost(post);
                postTag.setTaggedUser(taggedUser);
                postTag.setStatus(true);
                postTagRepository.save(postTag);
            }
        }

        return convertToDto(post);
    }

    public List<PostResponseDto> getAllPosts(String username) {
        logger.info("Fetching all posts for user: {}", username);

        var user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("User not found or inactive"));

        List<Post> posts = postRepository.findAllActivePosts();
        return posts.stream()
                .filter(post -> hasAccess(user.getId(), post.getId(), 1))
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<PostResponseDto> getPostsByUsername(String targetUsername, String currentUsername) {
        logger.info("Fetching posts for username: {} by user: {}", targetUsername, currentUsername);

        var currentUser = userRepository.findByUsernameAndStatusTrue(currentUsername)
                .orElseThrow(() -> new UserNotFoundException("Current user not found or inactive"));

        List<Post> posts = postRepository.findActivePostsByUsername(targetUsername);
        return posts.stream()
                .filter(post -> hasAccess(currentUser.getId(), post.getId(), 1))
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private boolean hasAccess(Integer userId, Integer contentId, Integer contentTypeId) {
        logger.debug("Checking access for userId: {}, contentId: {}, contentTypeId: {}", userId, contentId, contentTypeId);
        Post post = postRepository.findById(contentId)
                .orElseThrow(() -> new UserNotFoundException("Post not found with id: " + contentId));
        boolean hasAccess = privacyService.checkContentAccess(userId, contentId, "post");
        logger.debug("Access result for userId: {}, contentId: {} - {}", userId, contentId, hasAccess);
        return hasAccess;
    }

    private PostResponseDto convertToDto(Post post) {
        PostResponseDto dto = new PostResponseDto();
        dto.setId(post.getId());
        dto.setOwner(new UserTagDto(post.getOwner()));
        dto.setContent(post.getContent());
        dto.setPrivacySetting(post.getPrivacySetting());
        dto.setCreatedAt(post.getCreatedAt());

        List<PostTag> postTags = postTagRepository.findByPostIdAndStatusTrue(post.getId());
        dto.setTaggedUsers(postTags.stream()
                .map(postTag -> new UserTagDto(postTag.getTaggedUser()))
                .collect(Collectors.toList()));

        dto.setCommentCount(post.getTblComments().size());
        dto.setLikeCount(0);
        dto.setShareCount(0);

        return dto;
    }
}