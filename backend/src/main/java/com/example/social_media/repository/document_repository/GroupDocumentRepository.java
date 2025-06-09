package com.example.social_media.repository.document_repository;

import com.example.social_media.document.GroupDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository

public interface GroupDocumentRepository extends ElasticsearchRepository<GroupDocument, String> {
    List<GroupDocument> findByNameContainingIgnoreCase(String name);
}