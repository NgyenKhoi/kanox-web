package com.example.social_media.service;

import com.example.social_media.dto.post.PostRequestDto;
import com.example.social_media.dto.post.PostResponseDto;
import com.example.social_media.dto.user.UserTagDto;
import com.example.social_media.entity.*;
import com.example.social_media.exception.RegistrationException;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.exception.UnauthorizedException;
import com.example.social_media.repository.*;
import com.example.social_media.repository.post_repository.HiddenPostRepository;
import com.example.social_media.repository.post_repository.PostRepository;
import com.example.social_media.repository.post_repository.PostTagRepository;
import com.example.social_media.repository.post_repository.SavedPostRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
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
    private final MediaService mediaService;
    private final CommentRepository commentRepository;
    private final SavedPostRepository savedPostRepository;
    private final HiddenPostRepository hiddenPostRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    public PostService(PostRepository postRepository, PostTagRepository postTagRepository,
            UserRepository userRepository, ContentPrivacyRepository contentPrivacyRepository,
            CustomPrivacyListRepository customPrivacyListRepository, PrivacyService privacyService,
            MediaService mediaService, CommentRepository commentRepository,
                       SavedPostRepository savedPostRepository, HiddenPostRepository hiddenPostRepository,
                       GroupRepository groupRepository,
                       GroupMemberRepository groupMemberRepository) {
        this.postRepository = postRepository;
        this.postTagRepository = postTagRepository;
        this.userRepository = userRepository;
        this.contentPrivacyRepository = contentPrivacyRepository;
        this.customPrivacyListRepository = customPrivacyListRepository;
        this.privacyService = privacyService;
        this.mediaService = mediaService; // Khởi tạo MediaService
        this.commentRepository = commentRepository;
        this.savedPostRepository = savedPostRepository;
        this.hiddenPostRepository = hiddenPostRepository;
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
    }

    @Transactional
    public PostResponseDto createPost(PostRequestDto dto, String username, List<MultipartFile> mediaFiles) {
        logger.info("Creating post for user: {}", username);
        logger.debug("PostRequestDto: {}", dto);

        var user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("User not found or inactive"));

        String privacySetting = dto.getPrivacySetting() != null ? dto.getPrivacySetting()
                : privacyService.getPrivacySettingByUserId(user.getId()).getPostViewer();

        if ("private".equals(privacySetting)) {
            privacySetting = "only_me";
        }

        if (!List.of("public", "friends", "only_me", "custom").contains(privacySetting)) {
            throw new IllegalArgumentException("Invalid privacy setting: " + privacySetting);
        }

        CustomPrivacyList customList = null;
        Integer customListId = dto.getCustomListId();
        if ("custom".equals(privacySetting)) {
            if (customListId == null) {
                throw new IllegalArgumentException("Custom list ID is required for custom privacy setting");
            }
            customList = customPrivacyListRepository.findByIdAndStatus(customListId, true)
                    .orElseThrow(() -> new IllegalArgumentException("Custom list not found with id: " + customListId));
        }

        String taggedUserIds = dto.getTaggedUserIds() != null
                ? String.join(",", dto.getTaggedUserIds().stream().map(String::valueOf).toList())
                : null;

        Integer groupId = dto.getGroupId();
        if (groupId != null && !groupRepository.findByIdAndStatusTrue(groupId).isPresent()) {
            throw new IllegalArgumentException("Group not found or inactive with id: " + groupId);
        }

        Integer newPostId = postRepository.createPost(
                user.getId(), dto.getContent(), privacySetting, null, taggedUserIds, customListId, groupId);

        if (newPostId == null) {
            throw new RegistrationException("Failed to create post");
        }

        Post latestPost = postRepository.findById(newPostId)
                .orElseThrow(() -> new RegistrationException("Post creation failed - not found"));

        ContentPrivacy contentPrivacy = contentPrivacyRepository.findByContentIdAndContentTypeId(newPostId, 1)
                .orElseGet(() -> {
                    ContentPrivacy newPrivacy = new ContentPrivacy();
                    ContentPrivacyId id = new ContentPrivacyId();
                    id.setContentId(newPostId);
                    id.setContentTypeId(1);
                    newPrivacy.setId(id);
                    newPrivacy.setStatus(true);
                    return newPrivacy;
                });
        contentPrivacy.setPrivacySetting(privacySetting);
        contentPrivacy.setCustomList(customList);
        contentPrivacyRepository.save(contentPrivacy);

        if (mediaFiles != null && !mediaFiles.isEmpty()) {
            try {
                mediaService.uploadPostMediaFiles(user.getId(), newPostId, mediaFiles, dto.getContent());
            } catch (Exception e) {
                logger.error("Failed to upload media: {}", e.getMessage());
                throw new IllegalArgumentException("Failed to upload media: " + e.getMessage(), e);
            }
        }

        if (dto.getTaggedUserIds() != null) {
            postTagRepository.deleteByPostId(newPostId);
            for (Integer taggedUserId : dto.getTaggedUserIds()) {
                var taggedUser = userRepository.findById(taggedUserId)
                        .orElseThrow(() -> new UserNotFoundException("Tagged user not found: " + taggedUserId));
                PostTag postTag = new PostTag();
                postTag.setPost(latestPost);
                postTag.setTaggedUser(taggedUser);
                postTag.setStatus(true);
                postTagRepository.save(postTag);
            }
        }

        return convertToDto(latestPost, user.getId());
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

        String privacySetting = dto.getPrivacySetting() != null ? dto.getPrivacySetting()
                : privacyService.getPrivacySettingByUserId(user.getId()).getPostViewer();

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

        return convertToDto(post, user.getId());
    }

    @Transactional
    public void deletePost(Integer postId, String username) {
        logger.info("Xóa bài viết {} cho người dùng: {}", postId, username);

        var user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(
                        () -> new UserNotFoundException("Không tìm thấy người dùng hoặc người dùng không hoạt động"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết với id: " + postId));

        if (post.getOwner() == null || !post.getOwner().getId().equals(user.getId())) {
            throw new UnauthorizedException("Bạn không có quyền xóa bài viết này");
        }

        logger.debug("Xóa các thẻ bài viết cho postId: {}", postId);
        postTagRepository.deleteByPostId(postId);

        commentRepository.findByPostIdAndStatusTrue(postId).forEach(comment -> {
            logger.debug("Xóa mềm bình luận với id: {}", comment.getId());
            comment.setStatus(false);
            commentRepository.save(comment);
        });

        logger.debug("Xóa mềm bài viết với id: {}", postId);
        post.setStatus(false);
        postRepository.save(post);
    }

    public List<PostResponseDto> getAllPosts(String username) {
        logger.info("Fetching newsfeed for user: {}", username);

        User user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("User not found or inactive"));

        List<Integer> hiddenPostIds = hiddenPostRepository.findHiddenPostIdsByUserId(user.getId());

        List<Integer> joinedGroupIds = groupMemberRepository
                .findByUserIdAndStatusTrueAndInviteStatusAccepted(user.getId())
                .stream()
                .map(m -> m.getGroup().getId())
                .toList();

        List<Post> posts = postRepository.findAllActivePosts();

        return posts.stream()
                .filter(post -> !hiddenPostIds.contains(post.getId()))
                .filter(post -> {
                    if (post.getGroup() != null) {
                        String privacy = post.getGroup().getPrivacyLevel();
                        if ("public".equals(privacy)) return true;
                        // Nếu nhóm là private thì user phải là thành viên
                        return joinedGroupIds.contains(post.getGroup().getId());
                    }
                    return true;
                })
                .filter(post -> hasAccess(user.getId(), post.getId(), 1))
                .map(post -> convertToDto(post, user.getId()))
                .collect(Collectors.toList());
    }

    public List<PostResponseDto> getPostsByUsername(String targetUsername, String currentUsername) {
        logger.info("Fetching posts for username: {} by user: {}", targetUsername, currentUsername);

        var currentUser = userRepository.findByUsernameAndStatusTrue(currentUsername)
                .orElseThrow(() -> new UserNotFoundException("Current user not found or inactive"));

        List<Integer> hiddenPostIds = hiddenPostRepository.findHiddenPostIdsByUserId(currentUser.getId());

        List<Post> posts = postRepository.findActivePostsByUsername(targetUsername);
        return posts.stream()
                .filter(post -> !hiddenPostIds.contains(post.getId())) // ← Lọc bài bị ẩn
                .filter(post -> hasAccess(currentUser.getId(), post.getId(), 1))
                .map(post -> convertToDto(post, currentUser.getId()))
                .collect(Collectors.toList());
    }

    private boolean hasAccess(Integer userId, Integer contentId, Integer contentTypeId) {
        logger.debug("Checking access for userId: {}, contentId: {}, contentTypeId: {}", userId, contentId,
                contentTypeId);
        Post post = postRepository.findById(contentId)
                .orElseThrow(() -> new UserNotFoundException("Post not found with id: " + contentId));
        boolean hasAccess = privacyService.checkContentAccess(userId, contentId, "post");
        logger.debug("Access result for userId: {}, contentId: {} - {}", userId, contentId, hasAccess);
        return hasAccess;
    }

    @Transactional
    public void savePost(Integer postId, String username) {
        logger.info("Lưu bài viết {} cho người dùng: {}", postId, username);

        var user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng hoặc người dùng không hoạt động"));

        var post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết với id: " + postId));

        try {
            savedPostRepository.callSavePost(user.getId(), postId);
            logger.debug("Đã gọi stored procedure sp_SavePost cho userId: {}, postId: {}", user.getId(), postId);
        } catch (Exception e) {
            logger.error("Lỗi khi gọi stored procedure sp_SavePost: {}", e.getMessage());

            if (e.getMessage().contains("Post already saved")) {
                throw new IllegalArgumentException("Bài viết đã được lưu trước đó");
            }

            throw new RuntimeException("Không thể lưu bài viết: " + e.getMessage(), e);
        }
    }


    @Transactional
    public void hidePost(Integer postId, String username) {
        logger.info("Ẩn bài viết {} cho người dùng: {}", postId, username);

        var user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng hoặc người dùng không hoạt động"));

        var post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết với id: " + postId));

        try {
            hiddenPostRepository.callHidePost(user.getId(), postId);
            logger.debug("Đã gọi stored procedure sp_HidePost cho userId: {}, postId: {}", user.getId(), postId);
        } catch (Exception e) {
            logger.error("Lỗi khi gọi stored procedure sp_HidePost: {}", e.getMessage());
            throw new RuntimeException("Không thể ẩn bài viết: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void unsavePost(Integer postId, String username) {
        var user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        var post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        var savedPostOpt = savedPostRepository.findByUserIdAndPostId(user.getId(), postId);

        if (savedPostOpt.isPresent()) {
            SavedPost savedPost = savedPostOpt.get();
            savedPost.setStatus(false);
            savedPostRepository.save(savedPost);
        } else {
            throw new IllegalArgumentException("Bài viết chưa được lưu trước đó");
        }
    }



    private PostResponseDto convertToDto(Post post, Integer currentUserId) {
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
        dto.setSaved(savedPostRepository.existsByUserIdAndPostIdAndStatusTrue(currentUserId, post.getId()));

        // Add group info if post belongs to a group
        if (post.getGroup() != null) {
            dto.setGroupId(post.getGroup().getId());
            dto.setGroupName(post.getGroup().getName());
            String groupAvatarUrl = mediaService.getFirstMediaUrlByTarget(
                    post.getGroup().getId(), "GROUP");
            dto.setGroupAvatarUrl(groupAvatarUrl);

            dto.setGroupPrivacyLevel(post.getGroup().getPrivacyLevel());
        }

        return dto;
    }


    public List<PostResponseDto> getSavedPostsForUser(String username, Instant from, Instant to) {
        var user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        List<SavedPost> savedPosts = savedPostRepository
                .findActiveSavedPostsByUserIdAndSaveTimeBetween(user.getId(), from, to);

        return savedPosts.stream()
                .map(sp -> convertToDto(sp.getPost(), user.getId()))
                .collect(Collectors.toList());
    }

    public List<PostResponseDto> getCommunityFeed(String username) {
        User user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("Người dùng không tồn tại"));

        List<Integer> joinedGroupIds = groupMemberRepository
                .findByUserIdAndStatusTrueAndInviteStatusAccepted(user.getId())
                .stream()
                .map(member -> member.getGroup().getId())
                .toList();

        List<Post> posts;
        if (!joinedGroupIds.isEmpty()) {
            posts = postRepository.findByGroupIdInAndStatusTrueOrderByCreatedAtDesc(joinedGroupIds);
        } else {
            posts = postRepository.findPostsFromPublicGroups();
        }

        return posts.stream()
                .filter(post -> hasAccess(user.getId(), post.getId(), 1)) // kiểm tra quyền xem
                .map(post -> convertToDto(post, user.getId()))
                .toList();
    }

    public List<PostResponseDto> getPostsByGroup(Integer groupId, String username) {
        logger.info("Lấy bài viết trong nhóm {} cho người dùng {}", groupId, username);

        User user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("Người dùng không tồn tại hoặc không hoạt động"));

        Group group = groupRepository.findByIdAndStatusTrue(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhóm hoặc nhóm đã bị vô hiệu"));

        // Nếu nhóm là private thì chỉ cho phép thành viên truy cập
        if ("private".equals(group.getPrivacyLevel())) {
            boolean isMember = groupMemberRepository.existsById_GroupIdAndId_UserIdAndStatusTrueAndInviteStatus(
                    groupId, user.getId(), "ACCEPTED");

            if (!isMember) {
                throw new UnauthorizedException("Bạn không phải là thành viên của nhóm này");
            }
        }

        List<Integer> hiddenPostIds = hiddenPostRepository.findHiddenPostIdsByUserId(user.getId());

        List<Post> posts = postRepository.findByGroupIdAndStatusTrueOrderByCreatedAtDesc(groupId);

        return posts.stream()
                .filter(post -> !hiddenPostIds.contains(post.getId()))
                .filter(post -> hasAccess(user.getId(), post.getId(), 1)) // đảm bảo kiểm tra quyền riêng tư
                .map(post -> convertToDto(post, user.getId()))
                .collect(Collectors.toList());
    }

    public List<PostResponseDto> getPostsByUserInGroup(Integer groupId, String targetUsername, String currentUsername) {
        logger.info("Lấy bài viết trong nhóm {} của người dùng {} cho người dùng {}", groupId, targetUsername, currentUsername);

        User currentUser = userRepository.findByUsernameAndStatusTrue(currentUsername)
                .orElseThrow(() -> new UserNotFoundException("Người dùng hiện tại không tồn tại hoặc không hoạt động"));

        User targetUser = userRepository.findByUsernameAndStatusTrue(targetUsername)
                .orElseThrow(() -> new UserNotFoundException("Người dùng cần lấy bài viết không tồn tại"));

        Group group = groupRepository.findByIdAndStatusTrue(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhóm hoặc nhóm đã bị vô hiệu"));

        if (!"public".equalsIgnoreCase(group.getPrivacyLevel())) {
            boolean isMember = groupMemberRepository.existsById_GroupIdAndId_UserIdAndStatusTrueAndInviteStatus(
                    groupId, currentUser.getId(), "ACCEPTED");

            if (!isMember) {
                throw new UnauthorizedException("Bạn không có quyền truy cập bài viết trong nhóm này");
            }
        }

        List<Integer> hiddenPostIds = hiddenPostRepository.findHiddenPostIdsByUserId(currentUser.getId());

        List<Post> posts = postRepository.findByOwnerIdAndGroupIdAndStatusTrueOrderByCreatedAtDesc(
                targetUser.getId(), groupId);

        return posts.stream()
                .filter(post -> !hiddenPostIds.contains(post.getId()))
                .filter(post -> hasAccess(currentUser.getId(), post.getId(), 1))
                .map(post -> convertToDto(post, currentUser.getId()))
                .collect(Collectors.toList());
    }

    public long countAllPosts() {
        return postRepository.count();
    }

}