package com.example.social_media.service;

import com.example.social_media.document.UserDocument;
import com.example.social_media.entity.User;
import com.example.social_media.mapper.DocumentMapper;
import com.example.social_media.repository.UserRepository;
import com.example.social_media.repository.document_repository.UserDocumentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

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

    public void syncAllUsersToElasticsearch() {
        List<User> allUsers = userRepo.findAll();
        List<UserDocument> docs = allUsers.stream()
                .map(mapper::toUserDocument)
                .collect(Collectors.toList());

        userDocRepo.saveAll(docs);

        System.out.println("Đã đồng bộ " + docs.size() + " users sang Elasticsearch.");
    }
}
