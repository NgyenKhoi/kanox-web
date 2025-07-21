package com.example.social_media.service;

import com.example.social_media.document.*;
import com.example.social_media.entity.*;
import com.example.social_media.mapper.DocumentMapper;
import com.example.social_media.repository.*;
import com.example.social_media.repository.document.GroupDocumentRepository;
import com.example.social_media.repository.document.PageDocumentRepository;
import com.example.social_media.repository.document.UserDocumentRepository;
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
        List<User> allUsers = userRepo.findAll().stream()
                .filter(user -> !Boolean.TRUE.equals(user.getIsSystem())) // 👈 Ẩn user hệ thống
                .collect(Collectors.toList());

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
            if (Boolean.TRUE.equals(user.getIsSystem())) {
                System.out.println("Bỏ qua đồng bộ user hệ thống với ID = " + userId);
                return;
            }
            UserDocument userDoc = mapper.toUserDocument(user);
            userDocRepo.save(userDoc);
            System.out.println("Đã đồng bộ user [" + user.getDisplayName() + "] sang Elasticsearch.");
        });
    }

    public void syncGroupToElasticsearch(Integer groupId) {
        groupRepo.findById(groupId).ifPresent(group -> {
            List<String> memberNames = groupMemberRepo.findAcceptedUsersByGroupId(groupId)
                    .stream()
                    .map(User::getDisplayName)
                    .collect(Collectors.toList());

            GroupDocument groupDoc = mapper.toGroupDocument(group, memberNames);
            groupDocRepo.save(groupDoc);
            System.out.println("Đã đồng bộ nhóm [" + group.getName() + "] với ID = " + groupId + " sang Elasticsearch.");
        });
    }

    public void syncAllToElasticsearch() {
        syncAllUsersToElasticsearch();
        syncAllGroupsToElasticsearch();
        syncAllPagesToElasticsearch();
    }
}
