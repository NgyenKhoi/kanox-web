package com.example.social_media.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.SortOrder;
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
    }

    private Query buildPrefixOrFuzzyQuery(String field, String keyword) {
        return Query.of(q -> q.bool(b -> b
                .should(s -> s.prefix(p -> p.field(field).value(keyword.toLowerCase())))
                .should(s -> s.match(m -> m.field(field).query(keyword).fuzziness("AUTO")))
                .minimumShouldMatch("1")
        ));
    }

    private <T> List<T> searchWithPrefixAndSort(String indexName, String field, String keyword, Class<T> clazz) throws IOException {
        ensureIndexExists(indexName);
        Query query = buildPrefixOrFuzzyQuery(field, keyword);

        SearchRequest request = SearchRequest.of(s -> s
                .index(indexName)
                .query(query)
                .sort(sort -> sort
                        .field(f -> f
                                .field(field)
                                .order(SortOrder.Asc)
                        )
                )
        );

        SearchResponse<T> response = elasticsearchClient.search(request, clazz);
        return response.hits().hits().stream()
                .map(Hit::source)
                .collect(Collectors.toList());
    }

    public List<UserDocument> searchUsers(String keyword) throws IOException {
        return searchWithPrefixAndSort("user", "displayName", keyword, UserDocument.class);
    }

    public List<GroupDocument> searchGroups(String keyword) throws IOException {
        return searchWithPrefixAndSort("groups", "name", keyword, GroupDocument.class);
    }

    public List<PageDocument> searchPages(String keyword) throws IOException {
        return searchWithPrefixAndSort("pages", "name", keyword, PageDocument.class);
    }

    public Map<String, List<?>> searchAll(String keyword) {
        Map<String, List<?>> result = new HashMap<>();
        try {
            result.put("users", searchUsers(keyword));
        } catch (IOException e) {
            result.put("users", Collections.emptyList());
            e.printStackTrace();
        }

        try {
            result.put("groups", searchGroups(keyword));
        } catch (IOException e) {
            result.put("groups", Collections.emptyList());
            e.printStackTrace();
        }

        try {
            result.put("pages", searchPages(keyword));
        } catch (IOException e) {
            result.put("pages", Collections.emptyList());
            e.printStackTrace();
        }

        return result;
    }
}