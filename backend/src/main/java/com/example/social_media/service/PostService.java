package com.example.social_media.service;

import com.example.social_media.dto.post.PostRequestDto;
import com.example.social_media.dto.post.PostResponseDto;
import com.example.social_media.dto.user.UserTagDto;
import com.example.social_media.entity.Post;
import com.example.social_media.entity.PostTag;
import com.example.social_media.exception.BadRequestException;
import com.example.social_media.exception.NotFoundException;
import com.example.social_media.repository.ContentPrivacyRepository;
import com.example.social_media.repository.PostRepository;
import com.example.social_media.repository.PostTagRepository;
import com.example.social_media.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PostService {
    private static final Logger logger = LoggerFactory.getLogger(PostService.class);

    private final PostRepository postRepository;
    private final PostTagRepository postTagRepository;
    private final UserRepository userRepository;
    private final ContentPrivacyRepository contentPrivacyRepository;

    public PostService(PostRepository postRepository, PostTagRepository postTagRepository,
                       UserRepository userRepository, ContentPrivacyRepository contentPrivacyRepository) {
        this.postRepository = postRepository;
        this.postTagRepository = postTagRepository;
        this.userRepository = userRepository;
        this.contentPrivacyRepository = contentPrivacyRepository;
    }

    public PostResponseDto createPost(PostRequestDto dto, String username) {
        logger.info("Creating post for user: {}", username);

        var user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new NotFoundException("User not found or inactive"));

        String taggedUserIds = dto.getTaggedUserIds() != null ? String.join(",", dto.getTaggedUserIds().stream().map(String::valueOf).toList()) : null;

        postRepository.createPost(user.getId(), dto.getContent(), dto.getPrivacySetting(), null, taggedUserIds, dto.getCustomListId());

        var posts = postRepository.findActivePostsByUsername(username);
        if (posts.isEmpty()) {
            throw new BadRequestException("Failed to create post");
        }
        Post latestPost = posts.get(0);

        return convertToDto(latestPost);
    }

    public List<PostResponseDto> getAllPosts(String username) {
        logger.info("Fetching all posts for user: {}", username);

        var user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new NotFoundException("User not found or inactive"));

        List<Post> posts = postRepository.findAllActivePosts();
        return posts.stream()
                .filter(post -> hasAccess(user.getId(), post.getId(), 1))
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<PostResponseDto> getPostsByUsername(String targetUsername, String currentUsername) {
        logger.info("Fetching posts for username: {} by user: {}", targetUsername, currentUsername);

        var currentUser = userRepository.findByUsernameAndStatusTrue(currentUsername)
                .orElseThrow(() -> new NotFoundException("Current user not found or inactive"));

        List<Post> posts = postRepository.findActivePostsByUsername(targetUsername);
        return posts.stream()
                .filter(post -> hasAccess(currentUser.getId(), post.getId(), 1))
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private boolean hasAccess(Integer userId, Integer contentId, Integer contentTypeId) {
        // Gọi sp_CheckContentAccess (giả định trả về true)
        return true;
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