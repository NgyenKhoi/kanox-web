package com.example.social_media.repository.document_repository;

import com.example.social_media.document.PageDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

public interface PageDocumentRepository extends ElasticsearchRepository<PageDocument, String> {
    List<PageDocument> findByNameContainingIgnoreCase(String name);
}
