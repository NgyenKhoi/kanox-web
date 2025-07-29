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
import com.example.social_media.repository.post.*;

import com.google.maps.model.GeocodingResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.*;
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
    private final PostShareRepository postShareRepository;
    private final PostAIModerationRepository postAIModerationRepository;
    private final GeocodingService geocodingService;

    public PostService(
            PostRepository postRepository,
            PostTagRepository postTagRepository,
            UserRepository userRepository,
            ContentPrivacyRepository contentPrivacyRepository,
            CustomPrivacyListRepository customPrivacyListRepository,
            PrivacyService privacyService,
            MediaService mediaService,
            CommentRepository commentRepository,
            SavedPostRepository savedPostRepository,
            HiddenPostRepository hiddenPostRepository,
            GroupRepository groupRepository,
            GroupMemberRepository groupMemberRepository,
            ReactionService reactionService,
            TargetTypeRepository targetTypeRepository,
            PostShareRepository postShareRepository,
            PostAIModerationRepository postAIModerationRepository,
            GeocodingService geocodingService) {
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
        this.postShareRepository = postShareRepository;
        this.postAIModerationRepository = postAIModerationRepository;
        this.geocodingService = geocodingService;
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

        if (dto.getLocationName() == null && dto.getLatitude() != null && dto.getLongitude() != null) {
            try {
                GeocodingResult[] results = geocodingService.geocodeAddress(dto.getLatitude() + "," + dto.getLongitude());
                dto.setLocationName(results[0].formattedAddress);
            } catch (Exception e) {
                logger.warn("Không thể lấy tên địa điểm: {}", e.getMessage());
            }
        }

        Integer newPostId = postRepository.createPost(
                user.getId(), dto.getContent(), privacySetting, null, taggedUserIds, customListId, groupId,
                dto.getLatitude(), dto.getLongitude(), dto.getLocationName());

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

        if (dto.getLocationName() == null && dto.getLatitude() != null && dto.getLongitude() != null) {
            try {
                GeocodingResult[] results = geocodingService.geocodeAddress(dto.getLatitude() + "," + dto.getLongitude());
                dto.setLocationName(results[0].formattedAddress);
            } catch (Exception e) {
                logger.warn("Không thể lấy tên địa điểm: {}", e.getMessage());
            }
        }

        post.setContent(dto.getContent());
        post.setPrivacySetting(privacySetting);
        post.setLatitude(dto.getLatitude());
        post.setLongitude(dto.getLongitude());
        post.setLocationName(dto.getLocationName());
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

        List<Post> posts = postRepository.findNewsfeedPosts(user.getId());
        if (posts.isEmpty()) return List.of();

        List<Integer> postIds = posts.stream().map(Post::getId).toList();
        Set<Integer> hiddenPostIds = new HashSet<>(hiddenPostRepository.findHiddenPostIdsByUserId(user.getId()));
        Set<Integer> savedPostIds = savedPostRepository.findByUserIdAndStatusTrue(user.getId())
                .stream().map(sp -> sp.getPost().getId()).collect(Collectors.toSet());
        Set<Integer> joinedGroupIds = groupMemberRepository
                .findByUserIdAndStatusTrueAndInviteStatusAccepted(user.getId())
                .stream().map(m -> m.getGroup().getId()).collect(Collectors.toSet());

        Map<Integer, Boolean> accessMap = privacyService.checkContentAccessBatch(user.getId(), postIds, "post");

        Map<Integer, List<PostTag>> postTagsMap = postTagRepository.findByPost_IdInAndStatusTrue(postIds)
                .stream().collect(Collectors.groupingBy(pt -> pt.getPost().getId()));
        Map<Integer, List<MediaDto>> mediaMap = mediaService.getMediaByTargetIds(postIds, "POST", null, true);
        Map<Integer, Map<ReactionType, Long>> reactionCountMap = reactionService.countAllReactionsBatch(postIds, "POST");

        Set<Integer> flaggedPostIds = new HashSet<>(postAIModerationRepository.findFlaggedPostIds());
        List<Integer> savedPostIdList = new ArrayList<>(savedPostIds);

        return posts.stream()
                .filter(post -> isValidPostForUser(post, user.getId(), accessMap, hiddenPostIds, flaggedPostIds, joinedGroupIds))
                .map(post -> convertToDto(post, user.getId(), savedPostIdList, postTagsMap, mediaMap, reactionCountMap))
                .toList();
    }

        private boolean isValidPostForUser(Post post,
                                           int userId,
                                           Map<Integer, Boolean> accessMap,
                                           Set<Integer> hiddenPostIds,
                                           Set<Integer> flaggedPostIds,
                                           Set<Integer> joinedGroupIds) {

            int postId = post.getId();

            if (hiddenPostIds.contains(postId)) return false;
            if (flaggedPostIds.contains(postId)) return false;

            boolean access = accessMap.getOrDefault(postId, false);
            Group group = post.getGroup();

            if (group == null) return access;

            if ("public".equalsIgnoreCase(group.getPrivacyLevel())) return true;

            return joinedGroupIds.contains(group.getId()) && access;
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

        Integer userId = user.getId();

        // ✅ Lấy bài viết từ nhóm công khai + nhóm đã tham gia
        List<Post> posts = postRepository.findCommunityFeedPosts(userId);

        List<Integer> postIds = posts.stream().map(Post::getId).toList();

        // ✅ Kiểm tra quyền truy cập
        Map<Integer, Boolean> accessMap = privacyService.checkContentAccessBatch(userId, postIds, "post");

        // ✅ Bài viết đã lưu

        List<Integer> savedPostIds = savedPostRepository.findByUserIdAndStatusTrue(userId).stream()
                .map(sp -> sp.getPost().getId()).distinct().collect(Collectors.toList());

        // ✅ Gắn tag bài viết
        Map<Integer, List<PostTag>> postTagsMap = postTagRepository.findAllByPostIdInAndStatusTrue(postIds).stream()
                .collect(Collectors.groupingBy(pt -> pt.getPost().getId()));

        // ✅ Media
        Map<Integer, List<MediaDto>> mediaMap = new HashMap<>();
        if (!postIds.isEmpty()) {
            mediaMap.putAll(mediaService.getMediaByTargetIds(postIds, "POST", "image", true));
            mediaMap.putAll(mediaService.getMediaByTargetIds(postIds, "POST", "video", true));
        }

        // ✅ Reaction
        Map<Integer, Map<ReactionType, Long>> reactionCountMap = postIds.stream()
                .collect(Collectors.toMap(
                        postId -> postId,
                        postId -> reactionService.countAllReactions(postId, "POST")
                ));

        // ✅ Trả về DTO
        return posts.stream()
                .filter(post -> accessMap.getOrDefault(post.getId(), false))
                .map(post -> convertToDto(
                        post,
                        userId,
                        savedPostIds,
                        postTagsMap,
                        mediaMap,
                        reactionCountMap
                ))
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
        if (postShareRepository.findBySharedPostAndStatusTrue(originalPost).isPresent()) {
            throw new IllegalArgumentException("Cannot share a post that is already a share.");
        }

        // Tạo bài viết chia sẻ mới
        Post newSharePostEntity = new Post();
        newSharePostEntity.setOwner(sharer);
        newSharePostEntity.setContent(dto.getContent());
        newSharePostEntity.setPrivacySetting("public"); // Bài chia sẻ thường là công khai
        newSharePostEntity.setCreatedAt(Instant.now());
        newSharePostEntity.setStatus(true);
        // Lưu bài viết mới vào DB để lấy ID
        Post savedSharePostEntity = postRepository.save(newSharePostEntity);

        // 2. Tạo một bản ghi trong tblPostShare để liên kết bài viết mới và bài viết gốc
        PostShare shareRecord = new PostShare();
        shareRecord.setOriginalPost(originalPost);
        shareRecord.setSharedPost(savedSharePostEntity);
        shareRecord.setUser(sharer);
        shareRecord.setSharedAt(Instant.now());
        shareRecord.setStatus(true);
        postShareRepository.save(shareRecord);

        // 3. Chuyển đổi bài viết vừa tạo thành DTO để trả về cho client
        List<Integer> savedPostIds = savedPostRepository.findByUserIdAndStatusTrue(sharer.getId())
                .stream().map(sp -> sp.getPost().getId()).collect(Collectors.toList());

        // Truyền các map rỗng vì đây là một bài viết hoàn toàn mới, chưa có reaction hay tag
        return convertToDto(savedSharePostEntity, sharer.getId(), savedPostIds,
                Collections.emptyMap(), Collections.emptyMap(), Collections.emptyMap());
    }

    private PostResponseDto convertToDto(Post post, Integer currentUserId,
            List<Integer> savedPostIds, Map<Integer, List<PostTag>> postTagsMap,
            Map<Integer, List<MediaDto>> mediaMap, Map<Integer, Map<ReactionType, Long>> reactionCountMap) {

        PostResponseDto dto = new PostResponseDto();
        dto.setId(post.getId());
        dto.setOwner(new UserTagDto(post.getOwner().getId(), post.getOwner().getUsername(), post.getOwner().getDisplayName()));
        dto.setContent(post.getContent());
        dto.setPrivacySetting(post.getPrivacySetting());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setLatitude(post.getLatitude());
        dto.setLongitude(post.getLongitude());
        dto.setLocationName(post.getLocationName());

        // Lấy shareCount từ bảng tblPostShare thay vì từ tblPost
        dto.setShareCount((int) postShareRepository.countByOriginalPostAndStatusTrue(post));

        dto.setCommentCount(commentRepository.countByPostIdAndStatusTrue(post.getId()));

        List<PostTag> postTags = postTagsMap.getOrDefault(post.getId(), List.of());
        dto.setTaggedUsers(postTags.stream()
                .map(postTag -> new UserTagDto(postTag.getTaggedUser().getId(), postTag.getTaggedUser().getUsername(), postTag.getTaggedUser().getDisplayName()))
                .collect(Collectors.toList()));

        Map<ReactionType, Long> reactions = reactionCountMap.getOrDefault(post.getId(), Map.of());
        dto.setReactionCountMap(reactions.entrySet().stream()
                .collect(Collectors.toMap(entry -> entry.getKey().getName(), Map.Entry::getValue)));
        dto.setLikeCount(reactions.getOrDefault(
                reactionService.getMainReactions().stream().filter(rt -> "like".equalsIgnoreCase(rt.getName())).findFirst().orElse(null), 0L).intValue());

        dto.setSaved(savedPostIds.contains(post.getId()));

        if (post.getGroup() != null) {
            dto.setGroupId(post.getGroup().getId());
            dto.setGroupName(post.getGroup().getName());
            dto.setGroupAvatarUrl(mediaService.getFirstMediaUrlByTarget(post.getGroup().getId(), "GROUP"));
            dto.setGroupPrivacyLevel(post.getGroup().getPrivacyLevel());
        }

        // Logic quan trọng: Kiểm tra xem `post` này có phải là một bài chia sẻ không
        Optional<PostShare> shareRecordOpt = postShareRepository.findBySharedPostAndStatusTrue(post);

        if (shareRecordOpt.isPresent()) {
            // Nếu ĐÚNG, thì `post` là bài viết chứa bình luận, và chúng ta cần lấy bài gốc
            Post originalPost = shareRecordOpt.get().getOriginalPost();

            // Tải dữ liệu cần thiết cho bài viết gốc để hiển thị
            Map<Integer, List<MediaDto>> originalMediaMap = mediaService.getMediaByTargetIds(List.of(originalPost.getId()), "POST", null, true);
            Map<Integer, Map<ReactionType, Long>> originalReactionMap = reactionService.countAllReactionsBatch(List.of(originalPost.getId()), "POST");
            Map<Integer, List<PostTag>> originalTagsMap = postTagRepository.findByPost_IdInAndStatusTrue(List.of(originalPost.getId()))
                    .stream().collect(Collectors.groupingBy(pt -> pt.getPost().getId()));

            // Gọi đệ quy convertToDto để tạo DTO cho bài viết gốc
            PostResponseDto sharedPostDto = convertToDto(originalPost, currentUserId, savedPostIds, originalTagsMap, originalMediaMap, originalReactionMap);
            dto.setSharedPost(sharedPostDto); // Gán bài viết gốc vào trường sharedPost của DTO
            dto.setMedia(List.of()); // Bài viết chia sẻ không có media của riêng nó
        } else {
            // Nếu KHÔNG, thì `post` là một bài viết bình thường
            dto.setMedia(mediaMap.getOrDefault(post.getId(), List.of()));
            dto.setSharedPost(null);
        }

        return dto;
    }
}
