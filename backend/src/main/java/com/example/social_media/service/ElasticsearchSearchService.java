package com.example.social_media.service;

import com.example.social_media.document.*;
import com.example.social_media.repository.document_repository.*;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ElasticsearchSearchService {
    private final UserDocumentRepository userRepo;
    private final PostDocumentRepository postRepo;
    private final GroupDocumentRepository groupRepo;
    private final PageDocumentRepository pageRepo;
    private final MediaDocumentRepository mediaRepo;

    public ElasticsearchSearchService(
            UserDocumentRepository userRepo,
            PostDocumentRepository postRepo,
            GroupDocumentRepository groupRepo,
            PageDocumentRepository pageRepo,
            MediaDocumentRepository mediaRepo
    ) {
        this.userRepo = userRepo;
        this.postRepo = postRepo;
        this.groupRepo = groupRepo;
        this.pageRepo = pageRepo;
        this.mediaRepo = mediaRepo;
    }

    public List<UserDocument> searchUsers(String keyword) {
        return userRepo.findByUsernameContainingIgnoreCase(keyword);
    }

    public List<PostDocument> searchPosts(String keyword) {
        return postRepo.findByContentContainingIgnoreCase(keyword);
    }

    public List<GroupDocument> searchGroups(String keyword) {
        return groupRepo.findByNameContainingIgnoreCase(keyword);
    }

    public List<PageDocument> searchPages(String keyword) {
        return pageRepo.findByNameContainingIgnoreCase(keyword);
    }

    public List<MediaDocument> searchMedia(String keyword) {
        return mediaRepo.findByCaptionContainingIgnoreCase(keyword);
    }
}
