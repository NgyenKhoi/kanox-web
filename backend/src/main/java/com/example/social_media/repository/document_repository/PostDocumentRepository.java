package com.example.social_media.repository.document_repository;

import com.example.social_media.document.PostDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

public interface PostDocumentRepository extends ElasticsearchRepository<PostDocument, String> {
    List<PostDocument> findByContentContainingIgnoreCase(String content);
}
