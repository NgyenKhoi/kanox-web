package com.example.social_media.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import co.elastic.clients.elasticsearch.indices.CreateIndexRequest;
import co.elastic.clients.elasticsearch.indices.ExistsRequest;
import com.example.social_media.document.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class ElasticsearchSearchService {

    private final ElasticsearchClient elasticsearchClient;
    private final Set<String> checkedIndexes = ConcurrentHashMap.newKeySet();

    @Autowired
    public ElasticsearchSearchService(ElasticsearchClient elasticsearchClient) {
        this.elasticsearchClient = elasticsearchClient;
    }

    private void ensureIndexExists(String indexName) throws IOException {
        if (checkedIndexes.contains(indexName)) return;

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

            checkedIndexes.add(indexName);

        } catch (IOException e) {
            System.err.println("Lỗi khi kiểm tra/tạo index " + indexName + ": " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    private Query buildFuzzyBoostQuery(String field, String keyword) {
        BoolQuery.Builder boolQuery = new BoolQuery.Builder()
                .should(q -> q.match(m -> m.field(field).query(keyword).boost(2.0f)))
                .should(q -> q.match(m -> m.field(field).query(keyword).fuzziness("AUTO")))
                .minimumShouldMatch("1");
        return new Query(boolQuery.build());
    }

    public List<UserDocument> searchUsers(String keyword) throws IOException {
        ensureIndexExists("user");

        Query query = buildFuzzyBoostQuery("displayName", keyword);
        SearchRequest searchRequest = SearchRequest.of(s -> s
                .index("user")
                .query(query));

        SearchResponse<UserDocument> searchResponse =
                elasticsearchClient.search(searchRequest, UserDocument.class);

        return searchResponse.hits().hits().stream()
                .map(Hit::source)
                .collect(Collectors.toList());
    }

    public List<PostDocument> searchPosts(String keyword) throws IOException {
        ensureIndexExists("posts");

        Query query = buildFuzzyBoostQuery("content", keyword);
        SearchRequest searchRequest = SearchRequest.of(s -> s
                .index("posts")
                .query(query));

        SearchResponse<PostDocument> searchResponse =
                elasticsearchClient.search(searchRequest, PostDocument.class);

        return searchResponse.hits().hits().stream()
                .map(Hit::source)
                .collect(Collectors.toList());
    }

    public List<GroupDocument> searchGroups(String keyword) throws IOException {
        ensureIndexExists("groups");

        Query query = buildFuzzyBoostQuery("name", keyword);
        SearchRequest searchRequest = SearchRequest.of(s -> s
                .index("groups")
                .query(query));

        SearchResponse<GroupDocument> searchResponse =
                elasticsearchClient.search(searchRequest, GroupDocument.class);

        return searchResponse.hits().hits().stream()
                .map(Hit::source)
                .collect(Collectors.toList());
    }

    public List<PageDocument> searchPages(String keyword) throws IOException {
        ensureIndexExists("pages");

        Query query = buildFuzzyBoostQuery("name", keyword);
        SearchRequest searchRequest = SearchRequest.of(s -> s
                .index("pages")
                .query(query));

        SearchResponse<PageDocument> searchResponse =
                elasticsearchClient.search(searchRequest, PageDocument.class);

        return searchResponse.hits().hits().stream()
                .map(Hit::source)
                .collect(Collectors.toList());
    }

    public Map<String, List<?>> searchAll(String keyword) throws IOException {
        Map<String, List<?>> result = new HashMap<>();
        result.put("users", searchUsers(keyword));
//        result.put("posts", searchPosts(keyword));
//        result.put("groups", searchGroups(keyword));
//        result.put("pages", searchPages(keyword));
        return result;
    }
}
