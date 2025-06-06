package com.example.social_media.repository.document_repository;

import com.example.social_media.document.UserDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

public interface UserDocumentRepository extends ElasticsearchRepository<UserDocument, String> {
    List<UserDocument> findByUsernameContainingIgnoreCase(String keyword);
}
