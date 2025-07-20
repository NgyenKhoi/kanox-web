package com.example.social_media.repository.document;

import com.example.social_media.document.PageDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository

public interface PageDocumentRepository extends ElasticsearchRepository<PageDocument, String> {
    List<PageDocument> findByNameContainingIgnoreCase(String name);
}
