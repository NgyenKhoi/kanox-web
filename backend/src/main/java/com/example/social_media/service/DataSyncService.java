package com.example.social_media.service;

import com.example.social_media.document.*;
import com.example.social_media.entity.*;
import com.example.social_media.mapper.DocumentMapper;
import com.example.social_media.repository.*;
import com.example.social_media.repository.document_repository.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DataSyncService {

    private final UserRepository userRepo;
    private final GroupRepository groupRepo;
    private final PageRepository pageRepo;
    private final GroupMemberRepository groupMemberRepo;

    private final UserDocumentRepository userDocRepo;
    private final GroupDocumentRepository groupDocRepo;
    private final PageDocumentRepository pageDocRepo;

    private final DocumentMapper mapper;

    public DataSyncService(
            UserRepository userRepo,
            GroupRepository groupRepo,
            PageRepository pageRepo,
            UserDocumentRepository userDocRepo,
            GroupDocumentRepository groupDocRepo,
            PageDocumentRepository pageDocRepo,
            DocumentMapper mapper,
            GroupMemberRepository groupMemberRepo
    ) {
        this.userRepo = userRepo;
        this.groupRepo = groupRepo;
        this.pageRepo = pageRepo;
        this.userDocRepo = userDocRepo;
        this.groupDocRepo = groupDocRepo;
        this.pageDocRepo = pageDocRepo;
        this.mapper = mapper;
        this.groupMemberRepo = groupMemberRepo;
    }

    public void syncAllUsersToElasticsearch() {
        List<User> allUsers = userRepo.findAll();
        List<UserDocument> docs = allUsers.stream()
                .map(mapper::toUserDocument)
                .collect(Collectors.toList());
        userDocRepo.saveAll(docs);
        System.out.println("Đã đồng bộ " + docs.size() + " users sang Elasticsearch.");
    }

    public void syncAllGroupsToElasticsearch() {
        List<Group> allGroups = groupRepo.findAll();
        List<GroupDocument> docs = allGroups.stream()
                .map(group -> {
                    List<String> memberNames = groupMemberRepo.findAcceptedUsersByGroupId(group.getId())
                            .stream()
                            .map(u -> u.getDisplayName())
                            .collect(Collectors.toList());
                    return mapper.toGroupDocument(group, memberNames);
                })
                .collect(Collectors.toList());

        groupDocRepo.saveAll(docs);
        System.out.println("Đã đồng bộ " + docs.size() + " groups sang Elasticsearch.");
    }

    public void syncAllPagesToElasticsearch() {
        List<Page> allPages = pageRepo.findAll();
        List<PageDocument> docs = allPages.stream()
                .map(mapper::toPageDocument)
                .collect(Collectors.toList());
        pageDocRepo.saveAll(docs);
        System.out.println("Đã đồng bộ " + docs.size() + " pages sang Elasticsearch.");
    }

    public void syncUserToElasticsearch(Integer userId) {
        userRepo.findById(userId).ifPresent(user -> {
            UserDocument userDoc = mapper.toUserDocument(user);
            System.out.println("Syncing user to Elasticsearch: " + userDoc.getDisplayName());
            userDocRepo.save(userDoc);
            System.out.println("Saved userDoc to ES");
        });
    }

    public void syncAllToElasticsearch() {
        syncAllUsersToElasticsearch();
        syncAllGroupsToElasticsearch();
        syncAllPagesToElasticsearch();
    }
}
