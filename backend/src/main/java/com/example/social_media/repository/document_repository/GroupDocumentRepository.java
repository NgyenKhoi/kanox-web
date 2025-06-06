package com.example.social_media.repository.document_repository;

import com.example.social_media.document.GroupDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

public interface GroupDocumentRepository extends ElasticsearchRepository<GroupDocument, String> {
    List<GroupDocument> findByNameContainingIgnoreCase(String name);
}