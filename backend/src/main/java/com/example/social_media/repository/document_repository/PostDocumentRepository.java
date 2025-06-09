package com.example.social_media.repository.document_repository;

import com.example.social_media.document.PostDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface PostDocumentRepository extends ElasticsearchRepository<PostDocument, String> {
    List<PostDocument> findByContentContainingIgnoreCase(String content);
}
