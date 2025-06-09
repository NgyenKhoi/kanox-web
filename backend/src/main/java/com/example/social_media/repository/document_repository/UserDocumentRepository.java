package com.example.social_media.repository.document_repository;

import com.example.social_media.document.UserDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface UserDocumentRepository extends ElasticsearchRepository<UserDocument, String> {
    List<UserDocument> findByUsernameContainingIgnoreCase(String keyword);
}
