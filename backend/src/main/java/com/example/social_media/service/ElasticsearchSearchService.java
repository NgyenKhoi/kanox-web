package com.example.social_media.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.indices.CreateIndexRequest;
import co.elastic.clients.elasticsearch.indices.ExistsRequest;
import com.example.social_media.document.*;
import com.example.social_media.repository.document_repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ElasticsearchSearchService {
    private final UserDocumentRepository userRepo;
    private final PostDocumentRepository postRepo;
    private final GroupDocumentRepository groupRepo;
    private final PageDocumentRepository pageRepo;
    private final ElasticsearchClient elasticsearchClient;

    @Autowired
    public ElasticsearchSearchService(
            UserDocumentRepository userRepo,
            PostDocumentRepository postRepo,
            GroupDocumentRepository groupRepo,
            PageDocumentRepository pageRepo,
            ElasticsearchClient elasticsearchClient
    ) {
        this.userRepo = userRepo;
        this.postRepo = postRepo;
        this.groupRepo = groupRepo;
        this.pageRepo = pageRepo;
        this.elasticsearchClient = elasticsearchClient;
    }

    public void ensureIndexExists(String indexName) throws IOException {
        try {
            boolean exists = elasticsearchClient.indices()
                    .exists(ExistsRequest.of(e -> e.index(indexName)))
                    .value();

            if (!exists) {
                System.out.println("Index " + indexName + " không tồn tại, đang tạo...");
                CreateIndexRequest createRequest = CreateIndexRequest.of(c -> c
                        .index(indexName)
                        .settings(s -> s
                                .numberOfShards("1")
                                .numberOfReplicas("1"))
                );
                elasticsearchClient.indices().create(createRequest);
                System.out.println("Index " + indexName + " đã được tạo.");
            } else {
                System.out.println("Index " + indexName + " đã tồn tại.");
            }
        } catch (IOException e) {
            System.err.println("Lỗi khi kiểm tra/tạo index " + indexName + ": " + e.getMessage());
            throw e;
        }
    }
    public List<UserDocument> searchUsers(String keyword) throws IOException {
        ensureIndexExists("user");

        BoolQuery.Builder boolQuery = new BoolQuery.Builder()
                .should(q -> q.match(m -> m
                        .field("displayName")
                        .query(keyword)
                        .boost(2.0f)))
                .should(q -> q.match(m -> m
                        .field("displayName")
                        .query(keyword)
                        .fuzziness("AUTO")))
                .minimumShouldMatch("1");

        Query query = new Query(boolQuery.build());

        SearchRequest searchRequest = SearchRequest.of(s -> s
                .index("user")
                .query(query));

        SearchResponse<UserDocument> searchResponse = elasticsearchClient.search(searchRequest, UserDocument.class);
        return searchResponse.hits().hits().stream()
                .map(hit -> hit.source())
                .collect(Collectors.toList());
    }

    public List<PostDocument> searchPosts(String keyword) throws IOException {
        BoolQuery.Builder boolQuery = new BoolQuery.Builder()
                .should(q -> q.match(m -> m
                        .field("content")
                        .query(keyword)
                        .boost(2.0f)))
                .should(q -> q.match(m -> m
                        .field("content")
                        .query(keyword)
                        .fuzziness("AUTO")))
                .minimumShouldMatch("1");

        Query query = new Query(boolQuery.build());

        SearchRequest searchRequest = SearchRequest.of(s -> s
                .index("posts")
                .query(query));

        SearchResponse<PostDocument> searchResponse = elasticsearchClient.search(searchRequest, PostDocument.class);
        return searchResponse.hits().hits().stream()
                .map(hit -> hit.source())
                .collect(Collectors.toList());
    }

    public List<GroupDocument> searchGroups(String keyword) throws IOException {
        BoolQuery.Builder boolQuery = new BoolQuery.Builder()
                .should(q -> q.match(m -> m
                        .field("name")
                        .query(keyword)
                        .boost(2.0f)))
                .should(q -> q.match(m -> m
                        .field("name")
                        .query(keyword)
                        .fuzziness("AUTO")))
                .minimumShouldMatch("1");

        Query query = new Query(boolQuery.build());

        SearchRequest searchRequest = SearchRequest.of(s -> s
                .index("groups")
                .query(query));

        SearchResponse<GroupDocument> searchResponse = elasticsearchClient.search(searchRequest, GroupDocument.class);
        return searchResponse.hits().hits().stream()
                .map(hit -> hit.source())
                .collect(Collectors.toList());
    }

    public List<PageDocument> searchPages(String keyword) throws IOException {
        BoolQuery.Builder boolQuery = new BoolQuery.Builder()
                .should(q -> q.match(m -> m
                        .field("name")
                        .query(keyword)
                        .boost(2.0f)))
                .should(q -> q.match(m -> m
                        .field("name")
                        .query(keyword)
                        .fuzziness("AUTO")))
                .minimumShouldMatch("1");

        Query query = new Query(boolQuery.build());

        SearchRequest searchRequest = SearchRequest.of(s -> s
                .index("pages")
                .query(query));

        SearchResponse<PageDocument> searchResponse = elasticsearchClient.search(searchRequest, PageDocument.class);
        return searchResponse.hits().hits().stream()
                .map(hit -> hit.source())
                .collect(Collectors.toList());
    }
}