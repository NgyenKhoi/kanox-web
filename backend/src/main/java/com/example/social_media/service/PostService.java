package com.example.social_media.service;

import com.example.social_media.dto.media.MediaDto;
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
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.example.social_media.dto.post.SharePostRequestDto;

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
    private final ReactionService reactionService;
    private final TargetTypeRepository targetTypeRepository;

    public PostService(PostRepository postRepository, PostTagRepository postTagRepository,
            UserRepository userRepository, ContentPrivacyRepository contentPrivacyRepository,
            CustomPrivacyListRepository customPrivacyListRepository, PrivacyService privacyService,
            MediaService mediaService, CommentRepository commentRepository,
            SavedPostRepository savedPostRepository, HiddenPostRepository hiddenPostRepository,
            GroupRepository groupRepository, GroupMemberRepository groupMemberRepository,
            ReactionService reactionService,
            TargetTypeRepository targetTypeRepository) {
        this.postRepository = postRepository;
        this.postTagRepository = postTagRepository;
        this.userRepository = userRepository;
        this.contentPrivacyRepository = contentPrivacyRepository;
        this.customPrivacyListRepository = customPrivacyListRepository;
        this.privacyService = privacyService;
        this.mediaService = mediaService;
        this.commentRepository = commentRepository;
        this.savedPostRepository = savedPostRepository;
        this.hiddenPostRepository = hiddenPostRepository;
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.reactionService = reactionService;
        this.targetTypeRepository = targetTypeRepository;
    }

    @CacheEvict(value = {"newsfeed", "postsByUsername", "communityFeed", "postsByGroup", "postsByUserInGroup", "savedPosts"}, allEntries = true)
    @Transactional
    public PostResponseDto createPost(PostRequestDto dto, String username, List<MultipartFile> mediaFiles) {
        logger.info("Tạo bài viết cho người dùng: {}", username);
        logger.debug("PostRequestDto: {}", dto);

        var user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng hoặc người dùng không hoạt động"));

        String privacySetting = dto.getPrivacySetting() != null ? dto.getPrivacySetting()
                : privacyService.getPrivacySettingByUserId(user.getId()).getPostViewer();

        if ("private".equals(privacySetting)) {
            privacySetting = "only_me";
        }

        if (!List.of("public", "friends", "only_me", "custom").contains(privacySetting)) {
            throw new IllegalArgumentException("Cài đặt quyền riêng tư không hợp lệ: " + privacySetting);
        }

        CustomPrivacyList customList = null;
        Integer customListId = dto.getCustomListId();
        if ("custom".equals(privacySetting)) {
            if (customListId == null) {
                throw new IllegalArgumentException("Yêu cầu ID danh sách tùy chỉnh cho cài đặt quyền riêng tư tùy chỉnh");
            }
            customList = customPrivacyListRepository.findByIdAndStatus(customListId, true)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh sách tùy chỉnh với id: " + customListId));
        }

        String taggedUserIds = dto.getTaggedUserIds() != null
                ? String.join(",", dto.getTaggedUserIds().stream().map(String::valueOf).toList())
                : null;

        Integer groupId = dto.getGroupId();
        if (groupId != null && groupRepository.findByIdAndStatusTrue(groupId).isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy nhóm hoặc nhóm không hoạt động với id: " + groupId);
        }

        Integer newPostId = postRepository.createPost(
                user.getId(), dto.getContent(), privacySetting, null, taggedUserIds, customListId, groupId);

        if (newPostId == null) {
            throw new RegistrationException("Không thể tạo bài viết");
        }

        Post latestPost = postRepository.findById(newPostId)
                .orElseThrow(() -> new RegistrationException("Tạo bài viết thất bại - không tìm thấy"));

        ContentPrivacy contentPrivacy = contentPrivacyRepository.findByContentIdAndContentTypeId(newPostId, 1)
                .orElseGet(() -> {
                    ContentPrivacy newPrivacy = new ContentPrivacy();
                    ContentPrivacyId id = new ContentPrivacyId();
                    id.setContentId(newPostId);
                    id.setContentTypeId(1);
                    newPrivacy.setId(id);
                    newPrivacy.setContentType(targetTypeRepository.findByCode("post")
                            .orElseThrow(() -> new IllegalArgumentException("Loại mục tiêu không hợp lệ: post")));
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
                logger.error("Không thể tải lên media: {}", e.getMessage());
                throw new IllegalArgumentException("Không thể tải lên media: " + e.getMessage(), e);
            }
        }

        List<PostTag> postTags = List.of();
        if (dto.getTaggedUserIds() != null) {
            postTagRepository.deleteByPostId(newPostId);
            for (Integer taggedUserId : dto.getTaggedUserIds()) {
                var taggedUser = userRepository.findById(taggedUserId)
                        .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng được gắn thẻ: " + taggedUserId));
                PostTag postTag = new PostTag();
                postTag.setPost(latestPost);
                postTag.setTaggedUser(taggedUser);
                postTag.setStatus(true);
                postTagRepository.save(postTag);
            }
            postTags = postTagRepository.findByPostIdAndStatusTrue(newPostId);
        }

        List<SavedPost> savedPosts = savedPostRepository.findByUserIdAndStatusTrue(user.getId());
        List<Integer> savedPostIds = savedPosts.stream()
                .map(sp -> sp.getPost().getId())
                .collect(Collectors.toList());

        Map<Integer, List<MediaDto>> mediaMap = new HashMap<>();
        mediaMap.putAll(mediaService.getMediaByTargetIds(List.of(newPostId), "POST", "image", true));
        mediaMap.putAll(mediaService.getMediaByTargetIds(List.of(newPostId), "POST", "video", true));

        Map<Integer, Map<ReactionType, Long>> reactionCountMap = Map.of(
                newPostId, reactionService.countAllReactions(newPostId, "POST")
        );

        return convertToDto(latestPost, user.getId(), savedPostIds, Map.of(newPostId, postTags), mediaMap, reactionCountMap);
    }

    @CacheEvict(value = {"newsfeed", "postsByUsername", "communityFeed", "postsByGroup", "postsByUserInGroup", "savedPosts"}, allEntries = true)
    @Transactional
    public PostResponseDto updatePost(Integer postId, PostRequestDto dto, String username) {
        logger.info("Cập nhật bài viết {} cho người dùng: {}", postId, username);
        logger.debug("PostRequestDto: {}", dto);

        var user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng hoặc người dùng không hoạt động"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy bài viết"));

        if (!post.getOwner().getId().equals(user.getId())) {
            throw new UnauthorizedException("Bạn không có quyền cập nhật bài viết này");
        }

        String privacySetting = dto.getPrivacySetting() != null ? dto.getPrivacySetting()
                : privacyService.getPrivacySettingByUserId(user.getId()).getPostViewer();

        if ("private".equals(privacySetting)) {
            privacySetting = "only_me";
        }

        if (!List.of("public", "friends", "only_me", "custom").contains(privacySetting)) {
            throw new IllegalArgumentException("Cài đặt quyền riêng tư không hợp lệ: " + privacySetting);
        }

        CustomPrivacyList customList = null;
        Integer customListId = dto.getCustomListId();
        if ("custom".equals(privacySetting)) {
            if (customListId == null) {
                throw new IllegalArgumentException("Yêu cầu ID danh sách tùy chỉnh cho cài đặt quyền riêng tư tùy chỉnh");
            }
            customList = customPrivacyListRepository.findByIdAndStatus(customListId, true)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh sách tùy chỉnh với id: " + customListId));
        }

        ContentPrivacy existingPrivacy = contentPrivacyRepository.findByContentIdAndContentTypeId(postId, 1)
                .orElseGet(() -> {
                    ContentPrivacy newPrivacy = new ContentPrivacy();
                    ContentPrivacyId id = new ContentPrivacyId();
                    id.setContentId(postId);
                    id.setContentTypeId(1);
                    newPrivacy.setId(id);
                    newPrivacy.setContentType(targetTypeRepository.findByCode("post")
                            .orElseThrow(() -> new IllegalArgumentException("Loại mục tiêu không hợp lệ: post")));
                    newPrivacy.setStatus(true);
                    return newPrivacy;
                });
        existingPrivacy.setPrivacySetting(privacySetting);
        existingPrivacy.setCustomList(customList);
        contentPrivacyRepository.save(existingPrivacy);

        post.setContent(dto.getContent());
        post.setPrivacySetting(privacySetting);
        postRepository.save(post);

        List<PostTag> postTags = List.of();
        if (dto.getTaggedUserIds() != null) {
            postTagRepository.deleteByPostId(postId);
            for (Integer taggedUserId : dto.getTaggedUserIds()) {
                var taggedUser = userRepository.findById(taggedUserId)
                        .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng được gắn thẻ: " + taggedUserId));
                PostTag postTag = new PostTag();
                postTag.setPost(post);
                postTag.setTaggedUser(taggedUser);
                postTag.setStatus(true);
                postTagRepository.save(postTag);
            }
            postTags = postTagRepository.findByPostIdAndStatusTrue(postId);
        }

        List<SavedPost> savedPosts = savedPostRepository.findByUserIdAndStatusTrue(user.getId());
        List<Integer> savedPostIds = savedPosts.stream()
                .map(sp -> sp.getPost().getId())
                .collect(Collectors.toList());

        Map<Integer, List<MediaDto>> mediaMap = new HashMap<>();
        mediaMap.putAll(mediaService.getMediaByTargetIds(List.of(postId), "POST", "image", true));
        mediaMap.putAll(mediaService.getMediaByTargetIds(List.of(postId), "POST", "video", true));

        Map<Integer, Map<ReactionType, Long>> reactionCountMap = Map.of(
                postId, reactionService.countAllReactions(postId, "POST")
        );

        return convertToDto(post, user.getId(), savedPostIds, Map.of(postId, postTags), mediaMap, reactionCountMap);
    }

    @CacheEvict(value = {"newsfeed", "postsByUsername", "communityFeed", "postsByGroup", "postsByUserInGroup", "savedPosts"}, allEntries = true)
    @Transactional
    public void deletePost(Integer postId, String username) {
        logger.info("Xóa bài viết {} cho người dùng: {}", postId, username);

        var user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng hoặc người dùng không hoạt động"));

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

    @Cacheable(value = "newsfeed", key = "#username")
    public List<PostResponseDto> getAllPosts(String username) {
        logger.info("Lấy newsfeed tối ưu cho người dùng: {}", username);

        User user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng hoặc người dùng không hoạt động"));

        // 1. Lấy tất cả bài viết newsfeed (tối đa 10–20 bản ghi như bạn nói)
        List<Post> posts = postRepository.findNewsfeedPosts(user.getId());
        if (posts.isEmpty()) {
            return List.of();
        }

        // 2. Các ID cần thiết
        List<Integer> postIds = posts.stream().map(Post::getId).toList();
        List<Integer> hiddenPostIds = hiddenPostRepository.findHiddenPostIdsByUserId(user.getId());
        List<Integer> savedPostIds = savedPostRepository.findByUserIdAndStatusTrue(user.getId())
                .stream().map(sp -> sp.getPost().getId()).toList();

        List<Integer> joinedGroupIds = groupMemberRepository
                .findByUserIdAndStatusTrueAndInviteStatusAccepted(user.getId())
                .stream().map(m -> m.getGroup().getId()).toList();

        Map<Integer, Boolean> accessMap = privacyService.checkContentAccessBatch(user.getId(), postIds, "post");

        // 3. Dữ liệu liên quan
        Map<Integer, List<PostTag>> postTagsMap = postTagRepository.findByPost_IdInAndStatusTrue(postIds)
                .stream().collect(Collectors.groupingBy(pt -> pt.getPost().getId()));

        Map<Integer, List<MediaDto>> mediaMap = mediaService.getMediaByTargetIds(postIds, "POST", null, true);

        Map<Integer, Map<ReactionType, Long>> reactionCountMap = reactionService.countAllReactionsBatch(postIds, "POST");

        // 4. Lọc và trả về DTO
        return posts.stream()
                .filter(post -> !hiddenPostIds.contains(post.getId()))
                .filter(post -> {
                    boolean access = accessMap.getOrDefault(post.getId(), false);
                    Group group = post.getGroup();
                    if (group == null) {
                        return access;
                    }
                    if ("public".equalsIgnoreCase(group.getPrivacyLevel())) {
                        return true;
                    }
                    return joinedGroupIds.contains(group.getId()) && access;
                })
                .map(post -> convertToDto(post, user.getId(), savedPostIds, postTagsMap, mediaMap, reactionCountMap))
                .toList();
    }

    @Cacheable(value = "postsByUsername", key = "#targetUsername + ':' + #currentUsername")
    public List<PostResponseDto> getPostsByUsername(String targetUsername, String currentUsername) {
        logger.info("Lấy bài viết cho username: {} bởi người dùng: {}", targetUsername, currentUsername);

        var currentUser = userRepository.findByUsernameAndStatusTrue(currentUsername)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng hiện tại hoặc người dùng không hoạt động"));

        List<Integer> hiddenPostIds = hiddenPostRepository.findHiddenPostIdsByUserId(currentUser.getId());

        List<SavedPost> savedPosts = savedPostRepository.findByUserIdAndStatusTrue(currentUser.getId());
        List<Integer> savedPostIds = savedPosts.stream()
                .map(sp -> sp.getPost().getId())
                .collect(Collectors.toList());

        List<Post> posts = postRepository.findActivePostsByUsername(targetUsername);
        List<Integer> postIds = posts.stream().map(Post::getId).collect(Collectors.toList());
        Map<Integer, Boolean> accessMap = privacyService.checkContentAccessBatch(currentUser.getId(), postIds, "post");

        Map<Integer, List<PostTag>> postTagsMap = postIds.stream()
                .flatMap(postId -> postTagRepository.findByPostIdAndStatusTrue(postId).stream())
                .collect(Collectors.groupingBy(pt -> pt.getPost().getId()));

        Map<Integer, List<MediaDto>> mediaMap = new HashMap<>();
        if (!postIds.isEmpty()) {
            mediaMap.putAll(mediaService.getMediaByTargetIds(postIds, "POST", "image", true));
            mediaMap.putAll(mediaService.getMediaByTargetIds(postIds, "POST", "video", true));
        }

        Map<Integer, Map<ReactionType, Long>> reactionCountMap = postIds.stream()
                .collect(Collectors.toMap(
                        postId -> postId,
                        postId -> reactionService.countAllReactions(postId, "POST")
                ));

        return posts.stream()
                .filter(post -> !hiddenPostIds.contains(post.getId()))
                .filter(post -> accessMap.getOrDefault(post.getId(), false))
                .map(post -> convertToDto(post, currentUser.getId(), savedPostIds, postTagsMap, mediaMap, reactionCountMap))
                .collect(Collectors.toList());
    }

    @Cacheable(value = "communityFeed", key = "#username")
    public List<PostResponseDto> getCommunityFeed(String username) {
        logger.info("Lấy dòng cộng đồng cho người dùng: {}", username);

        User user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng hoặc người dùng không hoạt động"));

        List<Integer> joinedGroupIds = groupMemberRepository
                .findByUserIdAndStatusTrueAndInviteStatusAccepted(user.getId())
                .stream()
                .map(member -> member.getGroup().getId())
                .toList();

        List<SavedPost> savedPosts = savedPostRepository.findByUserIdAndStatusTrue(user.getId());
        List<Integer> savedPostIds = savedPosts.stream()
                .map(sp -> sp.getPost().getId())
                .collect(Collectors.toList());

        List<Post> posts = joinedGroupIds.isEmpty()
                ? postRepository.findPostsFromPublicGroups()
                : postRepository.findByGroupIdInAndStatusTrueOrderByCreatedAtDesc(joinedGroupIds);

        List<Integer> postIds = posts.stream().map(Post::getId).collect(Collectors.toList());
        Map<Integer, Boolean> accessMap = privacyService.checkContentAccessBatch(user.getId(), postIds, "post");

        Map<Integer, List<PostTag>> postTagsMap = postIds.stream()
                .flatMap(postId -> postTagRepository.findByPostIdAndStatusTrue(postId).stream())
                .collect(Collectors.groupingBy(pt -> pt.getPost().getId()));

        Map<Integer, List<MediaDto>> mediaMap = new HashMap<>();
        if (!postIds.isEmpty()) {
            mediaMap.putAll(mediaService.getMediaByTargetIds(postIds, "POST", "image", true));
            mediaMap.putAll(mediaService.getMediaByTargetIds(postIds, "POST", "video", true));
        }

        Map<Integer, Map<ReactionType, Long>> reactionCountMap = postIds.stream()
                .collect(Collectors.toMap(
                        postId -> postId,
                        postId -> reactionService.countAllReactions(postId, "POST")
                ));

        return posts.stream()
                .filter(post -> accessMap.getOrDefault(post.getId(), false))
                .map(post -> convertToDto(post, user.getId(), savedPostIds, postTagsMap, mediaMap, reactionCountMap))
                .toList();
    }

    @Cacheable(value = "postsByGroup", key = "#groupId + ':' + #username")
    public List<PostResponseDto> getPostsByGroup(Integer groupId, String username) {
        logger.info("Lấy bài viết trong nhóm {} cho người dùng {}", groupId, username);

        User user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng hoặc người dùng không hoạt động"));

        Group group = groupRepository.findByIdAndStatusTrue(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhóm hoặc nhóm đã bị vô hiệu"));

        if ("private".equals(group.getPrivacyLevel())) {
            boolean isMember = groupMemberRepository.existsById_GroupIdAndId_UserIdAndStatusTrueAndInviteStatus(
                    groupId, user.getId(), "ACCEPTED");

            if (!isMember) {
                throw new UnauthorizedException("Bạn không phải là thành viên của nhóm này");
            }
        }

        List<Integer> hiddenPostIds = hiddenPostRepository.findHiddenPostIdsByUserId(user.getId());

        List<SavedPost> savedPosts = savedPostRepository.findByUserIdAndStatusTrue(user.getId());
        List<Integer> savedPostIds = savedPosts.stream()
                .map(sp -> sp.getPost().getId())
                .collect(Collectors.toList());

        List<Post> posts = postRepository.findByGroupIdAndStatusTrueOrderByCreatedAtDesc(groupId);
        List<Integer> postIds = posts.stream().map(Post::getId).collect(Collectors.toList());
        Map<Integer, Boolean> accessMap = privacyService.checkContentAccessBatch(user.getId(), postIds, "post");

        Map<Integer, List<PostTag>> postTagsMap = postIds.stream()
                .flatMap(postId -> postTagRepository.findByPostIdAndStatusTrue(postId).stream())
                .collect(Collectors.groupingBy(pt -> pt.getPost().getId()));

        Map<Integer, List<MediaDto>> mediaMap = new HashMap<>();
        if (!postIds.isEmpty()) {
            mediaMap.putAll(mediaService.getMediaByTargetIds(postIds, "POST", "image", true));
            mediaMap.putAll(mediaService.getMediaByTargetIds(postIds, "POST", "video", true));
        }

        Map<Integer, Map<ReactionType, Long>> reactionCountMap = postIds.stream()
                .collect(Collectors.toMap(
                        postId -> postId,
                        postId -> reactionService.countAllReactions(postId, "POST")
                ));

        return posts.stream()
                .filter(post -> !hiddenPostIds.contains(post.getId()))
                .filter(post -> accessMap.getOrDefault(post.getId(), false))
                .map(post -> convertToDto(post, user.getId(), savedPostIds, postTagsMap, mediaMap, reactionCountMap))
                .collect(Collectors.toList());
    }

    @Cacheable(value = "postsByUserInGroup", key = "#groupId + ':' + #targetUsername + ':' + #currentUsername")
    public List<PostResponseDto> getPostsByUserInGroup(Integer groupId, String targetUsername, String currentUsername) {
        logger.info("Lấy bài viết trong nhóm {} của người dùng {} cho người dùng {}", groupId, targetUsername, currentUsername);

        User currentUser = userRepository.findByUsernameAndStatusTrue(currentUsername)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng hiện tại hoặc người dùng không hoạt động"));

        User targetUser = userRepository.findByUsernameAndStatusTrue(targetUsername)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng cần lấy bài viết"));

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

        List<SavedPost> savedPosts = savedPostRepository.findByUserIdAndStatusTrue(currentUser.getId());
        List<Integer> savedPostIds = savedPosts.stream()
                .map(sp -> sp.getPost().getId())
                .collect(Collectors.toList());

        List<Post> posts = postRepository.findByOwnerIdAndGroupIdAndStatusTrueOrderByCreatedAtDesc(
                targetUser.getId(), groupId);
        List<Integer> postIds = posts.stream().map(Post::getId).collect(Collectors.toList());
        Map<Integer, Boolean> accessMap = privacyService.checkContentAccessBatch(currentUser.getId(), postIds, "post");

        Map<Integer, List<PostTag>> postTagsMap = postIds.stream()
                .flatMap(postId -> postTagRepository.findByPostIdAndStatusTrue(postId).stream())
                .collect(Collectors.groupingBy(pt -> pt.getPost().getId()));

        Map<Integer, List<MediaDto>> mediaMap = new HashMap<>();
        if (!postIds.isEmpty()) {
            mediaMap.putAll(mediaService.getMediaByTargetIds(postIds, "POST", "image", true));
            mediaMap.putAll(mediaService.getMediaByTargetIds(postIds, "POST", "video", true));
        }

        Map<Integer, Map<ReactionType, Long>> reactionCountMap = postIds.stream()
                .collect(Collectors.toMap(
                        postId -> postId,
                        postId -> reactionService.countAllReactions(postId, "POST")
                ));

        return posts.stream()
                .filter(post -> !hiddenPostIds.contains(post.getId()))
                .filter(post -> accessMap.getOrDefault(post.getId(), false))
                .map(post -> convertToDto(post, currentUser.getId(), savedPostIds, postTagsMap, mediaMap, reactionCountMap))
                .collect(Collectors.toList());
    }

    @CacheEvict(value = {"savedPosts", "newsfeed"}, allEntries = true)
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

    @CacheEvict(value = {"savedPosts", "newsfeed"}, allEntries = true)
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

    @CacheEvict(value = {"savedPosts", "newsfeed"}, allEntries = true)
    @Transactional
    public void unsavePost(Integer postId, String username) {
        var user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng hoặc người dùng không hoạt động"));

        var post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết"));

        var savedPostOpt = savedPostRepository.findByUserIdAndPostId(user.getId(), postId);

        if (savedPostOpt.isPresent()) {
            SavedPost savedPost = savedPostOpt.get();
            savedPost.setStatus(false);
            savedPostRepository.save(savedPost);
        } else {
            throw new IllegalArgumentException("Bài viết chưa được lưu trước đó");
        }
    }

    @Cacheable(value = "savedPosts", key = "#username + ':' + #from + ':' + #to")
    public List<PostResponseDto> getSavedPostsForUser(String username, Instant from, Instant to) {
        var user = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng hoặc người dùng không hoạt động"));

        List<SavedPost> savedPosts = savedPostRepository.findActiveSavedPostsByUserIdAndSaveTimeBetween(user.getId(), from, to);
        List<Integer> savedPostIds = savedPosts.stream()
                .map(sp -> sp.getPost().getId())
                .collect(Collectors.toList());

        List<Post> posts = savedPosts.stream()
                .map(SavedPost::getPost)
                .toList();

        List<Integer> postIds = posts.stream().map(Post::getId).collect(Collectors.toList());
        Map<Integer, Boolean> accessMap = privacyService.checkContentAccessBatch(user.getId(), postIds, "post");

        Map<Integer, List<PostTag>> postTagsMap = postIds.stream()
                .flatMap(postId -> postTagRepository.findByPostIdAndStatusTrue(postId).stream())
                .collect(Collectors.groupingBy(pt -> pt.getPost().getId()));

        Map<Integer, List<MediaDto>> mediaMap = new HashMap<>();
        if (!postIds.isEmpty()) {
            mediaMap.putAll(mediaService.getMediaByTargetIds(postIds, "POST", "image", true));
            mediaMap.putAll(mediaService.getMediaByTargetIds(postIds, "POST", "video", true));
        }

        Map<Integer, Map<ReactionType, Long>> reactionCountMap = postIds.stream()
                .collect(Collectors.toMap(
                        postId -> postId,
                        postId -> reactionService.countAllReactions(postId, "POST")
                ));

        return posts.stream()
                .filter(post -> accessMap.getOrDefault(post.getId(), false))
                .map(post -> convertToDto(post, user.getId(), savedPostIds, postTagsMap, mediaMap, reactionCountMap))
                .collect(Collectors.toList());
    }

    public long countAllPosts() {
        return postRepository.count();
    }

    @Transactional
    @CacheEvict(value = {"newsfeed", "postsByUsername", "communityFeed", "postsByGroup", "postsByUserInGroup"}, allEntries = true)
    public PostResponseDto sharePost(SharePostRequestDto dto, String username) {
        logger.info("Người dùng {} đang chia sẻ bài viết ID: {}", username, dto.getOriginalPostId());

        User sharer = userRepository.findByUsernameAndStatusTrue(username)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng hoặc người dùng không hoạt động"));

        Post originalPost = postRepository.findById(dto.getOriginalPostId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết gốc để chia sẻ"));

        // Không cho phép chia sẻ lại một bài đã là bài chia sẻ
        if (originalPost.getSharedPost() != null) {
            throw new IllegalArgumentException("Không thể chia sẻ một bài viết đã được chia sẻ.");
        }

        // Tạo bài viết chia sẻ mới
        Post newSharePost = new Post();
        newSharePost.setOwner(sharer);
        // Lấy nội dung từ DTO, đây là bình luận của người chia sẻ
        newSharePost.setContent(dto.getContent());
        newSharePost.setSharedPost(originalPost); // Liên kết tới bài viết gốc
        newSharePost.setCreatedAt(Instant.now());
        newSharePost.setStatus(true);
        // Bài viết mới tạo luôn có shareCount = 0
        newSharePost.setShareCount(0);
        // Mặc định bài chia sẻ là công khai
        newSharePost.setPrivacySetting("public");

        // Tăng đếm lượt chia sẻ của BÀI VIẾT GỐC
        originalPost.setShareCount(originalPost.getShareCount() + 1);
        postRepository.save(originalPost);

        // Lưu bài viết chia sẻ mới vào DB
        Post savedSharePost = postRepository.save(newSharePost);

        // Lấy dữ liệu cần thiết để chuyển đổi sang DTO
        List<Integer> savedPostIds = savedPostRepository.findByUserIdAndStatusTrue(sharer.getId())
                .stream().map(sp -> sp.getPost().getId()).collect(Collectors.toList());

        // Chuyển đổi và trả về
        return convertToDto(savedSharePost, sharer.getId(), savedPostIds,
                new HashMap<>(), new HashMap<>(), new HashMap<>());
    }

    private PostResponseDto convertToDto(Post post, Integer currentUserId,
            List<Integer> savedPostIds, Map<Integer, List<PostTag>> postTagsMap,
            Map<Integer, List<MediaDto>> mediaMap, Map<Integer, Map<ReactionType, Long>> reactionCountMap) {
        Post originalPost = post.getSharedPost();
        if (originalPost != null) {
            // Nếu map media chưa có dữ liệu cho bài viết gốc, hãy tải nó
            if (!mediaMap.containsKey(originalPost.getId())) {
                mediaMap.putAll(mediaService.getMediaByTargetIds(List.of(originalPost.getId()), "POST", null, true));
            }
            // Tương tự cho reaction, nếu cần hiển thị đầy đủ
            if (!reactionCountMap.containsKey(originalPost.getId())) {
                reactionCountMap.put(originalPost.getId(), reactionService.countAllReactions(originalPost.getId(), "POST"));
            }
            // Tương tự cho tags
            if (!postTagsMap.containsKey(originalPost.getId())) {
                postTagsMap.put(originalPost.getId(), postTagRepository.findByPostIdAndStatusTrue(originalPost.getId()));
            }
        }
        PostResponseDto dto = new PostResponseDto();
        dto.setId(post.getId());
        User owner = post.getOwner();
        dto.setOwner(new UserTagDto(owner.getId(), owner.getUsername(), owner.getDisplayName()));
        dto.setContent(post.getContent());
        dto.setPrivacySetting(post.getPrivacySetting());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setShareCount(post.getShareCount() != null ? post.getShareCount() : 0);

        List<PostTag> postTags = postTagsMap.getOrDefault(post.getId(), List.of());
        dto.setTaggedUsers(postTags.stream()
                .map(postTag -> {
                    User tagged = postTag.getTaggedUser();
                    return new UserTagDto(tagged.getId(), tagged.getUsername(), tagged.getDisplayName());
                })
                .collect(Collectors.toList()));

        dto.setCommentCount(post.getTblComments().size());

        Map<ReactionType, Long> reactions = reactionCountMap.getOrDefault(post.getId(), Map.of());
        dto.setReactionCountMap(reactions.entrySet().stream()
                .collect(Collectors.toMap(
                        entry -> entry.getKey().getName(),
                        Map.Entry::getValue
                )));
        dto.setLikeCount(reactions.getOrDefault(
                reactionService.getMainReactions().stream()
                        .filter(rt -> "like".equalsIgnoreCase(rt.getName()))
                        .findFirst().orElse(null), 0L).intValue());

        dto.setMedia(mediaMap.getOrDefault(post.getId(), List.of()));

        dto.setSaved(savedPostIds.contains(post.getId()));

        if (post.getGroup() != null) {
            dto.setGroupId(post.getGroup().getId());
            dto.setGroupName(post.getGroup().getName());
            dto.setGroupAvatarUrl(mediaService.getFirstMediaUrlByTarget(post.getGroup().getId(), "GROUP"));
            dto.setGroupPrivacyLevel(post.getGroup().getPrivacyLevel());
        }
        if (originalPost != null) {
            PostResponseDto sharedPostDto = convertToDto(originalPost, currentUserId, savedPostIds,
                    postTagsMap, mediaMap, reactionCountMap);
            dto.setSharedPost(sharedPostDto);
            // Một bài viết chia sẻ không có media của riêng nó, nó chỉ hiển thị media của bài gốc
            dto.setMedia(List.of());
        } else {
            // Chỉ set media nếu đây là bài viết gốc
            dto.setMedia(mediaMap.getOrDefault(post.getId(), List.of()));
            dto.setSharedPost(null);
        }

        return dto;
    }
}
