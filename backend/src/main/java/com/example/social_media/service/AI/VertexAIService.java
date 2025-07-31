package com.example.social_media.service.AI;

import com.example.social_media.dto.post.FlagResultDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class VertexAIService {

    private static final String PROJECT_ID = "social-media-cicd";
    private static final String LOCATION = "us-central1";
    private static final String MODEL_ID = "gemini-2.5-flash-lite";
    private static final String PUBLISHER = "google";

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    public Optional<FlagResultDto> analyzePost(String postContent) {
        try {
            // Load credentials
            InputStream credentialsStream = getClass().getClassLoader()
                    .getResourceAsStream("gcp-secret-credentials.json");
            if (credentialsStream == null) {
                log.error("❌ Không tìm thấy file gcp-secret-credentials.json");
                return Optional.empty();
            }

            GoogleCredentials credentials = GoogleCredentials
                    .fromStream(credentialsStream)
                    .createScoped("https://www.googleapis.com/auth/cloud-platform");
            credentials.refreshIfExpired();
            AccessToken token = credentials.getAccessToken();

            // Endpoint
            String url = String.format(
                    "https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/%s/models/%s:generateContent",
                    LOCATION, PROJECT_ID, LOCATION, PUBLISHER, MODEL_ID
            );

            // Prompt
            String prompt = """
                    Bạn là một hệ thống kiểm duyệt nội dung mạng xã hội.
                    Hãy đánh giá nội dung sau có vi phạm chính sách cộng đồng không:

                    - Không có lời lẽ căm ghét, kỳ thị, bạo lực, đe dọa.
                    - Không chứa nội dung tình dục rõ ràng, tục tĩu.
                    - Không lan truyền tin giả, spam, kích động.
                    - Không quấy rối hoặc mạo danh.

                    Trả lời JSON thuần như sau (không dùng dấu ``` hoặc mô tả):
                    {
                      "is_violation": true|false,
                      "violation_types": ["hate_speech", "sexual", "violence", "spam", "inappropriate", "fake_news", "harassment", "impersonation"],
                      "explanation": "Lý do ngắn gọn"
                    }

                    Nội dung:
                    "%s"
                    """.formatted(postContent);

            // Request body
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of(
                            "role", "user",
                            "parts", List.of(Map.of("text", prompt))
                    )),
                    "generationConfig", Map.of(
                            "temperature", 0.2,
                            "maxOutputTokens", 512
                    )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token.getTokenValue());
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(requestBody), headers);

            // Call API
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, JsonNode.class
            );

            JsonNode root = response.getBody();
            if (root == null || !root.has("candidates")) {
                log.error("❌ Response body không hợp lệ: {}", root);
                return Optional.empty();
            }

            JsonNode parts = root.path("candidates").path(0).path("content").path("parts");
            if (!parts.isArray() || parts.isEmpty()) {
                log.error("❌ Không tìm thấy content.parts trong phản hồi Gemini");
                return Optional.empty();
            }

            String resultText = parts.get(0).path("text").asText();

            // Xử lý nếu có dấu ```
            if (resultText.startsWith("```")) {
                resultText = resultText.replaceAll("(?s)```.*?\\n(\\{.*?\\})\\n```", "$1");
            }

            JsonNode resultNode;
            try {
                resultNode = objectMapper.readTree(resultText);
            } catch (Exception ex) {
                log.error("❌ Không parse được JSON từ Gemini:\n{}", resultText);
                return Optional.empty();
            }

            if (resultNode.get("is_violation") == null || resultNode.get("explanation") == null) {
                log.error("❌ JSON thiếu field bắt buộc: {}", resultNode.toPrettyString());
                return Optional.empty();
            }

            boolean isViolation = resultNode.get("is_violation").asBoolean();
            String explanation = resultNode.get("explanation").asText();

            List<String> violationTypes = new ArrayList<>();
            JsonNode typesNode = resultNode.get("violation_types");
            if (typesNode != null && typesNode.isArray()) {
                for (JsonNode typeNode : typesNode) {
                    violationTypes.add(typeNode.asText());
                }
            }

            List<String> mappedViolationTypes = mapViolationTypesToReportReasons(violationTypes);

            return Optional.of(FlagResultDto.builder()
                    .isViolation(isViolation)
                    .violationTypes(mappedViolationTypes)
                    .explanation(explanation)
                    .build());

        } catch (Exception e) {
            log.error("❌ Lỗi khi gọi Gemini API: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }

    private List<String> mapViolationTypesToReportReasons(List<String> violationTypes) {
        return violationTypes.stream()
                .map(type -> switch (type) {
                    case "hate_speech" -> "Ngôn ngữ thù địch";
                    case "sexual" -> "Nội dung khỏa thân";
                    case "violence" -> "Bạo lực";
                    case "spam" -> "Spam";
                    case "inappropriate" -> "Nội dung không phù hợp";
                    case "fake_news" -> "Tin giả";
                    case "harassment" -> "Quấy rối";
                    case "impersonation" -> "Tài khoản giả mạo";
                    default -> "Nội dung không phù hợp";
                })
                .distinct()
                .toList();
    }
}
