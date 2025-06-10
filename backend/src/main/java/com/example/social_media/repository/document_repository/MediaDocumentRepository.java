package com.example.social_media.repository.document_repository;

import com.example.social_media.document.MediaDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository

public interface MediaDocumentRepository extends ElasticsearchRepository<MediaDocument, String> {
    List<MediaDocument> findByCaptionContainingIgnoreCase(String caption);
}
