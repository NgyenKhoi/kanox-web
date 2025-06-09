package com.example.social_media.service;

import com.example.social_media.document.UserDocument;
import com.example.social_media.mapper.DocumentMapper;
import com.example.social_media.repository.UserRepository;
import com.example.social_media.repository.document_repository.UserDocumentRepository;
import org.springframework.stereotype.Service;

@Service
public class DataSyncService {
    private final UserRepository userRepo;
    private final UserDocumentRepository userDocRepo;
    private final DocumentMapper mapper;

    public DataSyncService(UserRepository userRepo, UserDocumentRepository userDocRepo, DocumentMapper mapper) {
        this.userRepo = userRepo;
        this.userDocRepo = userDocRepo;
        this.mapper = mapper;
    }

    public void syncUserToElasticsearch(Integer userId) {
        userRepo.findById(userId).ifPresent(user -> {
            UserDocument userDoc = mapper.toUserDocument(user);
            System.out.println("Syncing user to Elasticsearch: " + userDoc.getDisplayName());
            userDocRepo.save(userDoc);
            System.out.println("Saved userDoc to ES");
        });
    }
}
