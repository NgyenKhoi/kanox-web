package com.example.social_media.service.AI;

import com.example.social_media.dto.post.FlagResultDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class VertexAIService {

    private static final String PROJECT_ID = "social-media-cicd";
    private static final String LOCATION = "asia-southeast1";
    private static final String MODEL_ID = "gemini-1.5-pro"; // hoặc gemini-1.5-flash
    private static final String PUBLISHER = "google";

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    public Optional<FlagResultDto> analyzePost(String postContent) {
        try {
            // Load credentials from gcp-credentials.json
            InputStream credentialsStream = new ClassPathResource("gcp-credentials.json").getInputStream();
            GoogleCredentials credentials = GoogleCredentials.fromStream(credentialsStream)
                    .createScoped("https://www.googleapis.com/auth/cloud-platform");
            credentials.refreshIfExpired();
            AccessToken token = credentials.getAccessToken();

            // Endpoint URL
            String url = String.format(
                    "https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/%s/models/%s:generateContent",
                    LOCATION, PROJECT_ID, LOCATION, PUBLISHER, MODEL_ID
            );

            // Prompt content
            String prompt = """
                Bạn là một hệ thống kiểm duyệt nội dung tự động.

                Nội dung sau đây là một bài đăng hoặc bình luận từ mạng xã hội của người dùng. Vui lòng đánh giá xem nội dung này có vi phạm **chính sách cộng đồng** không.

                Chính sách cộng đồng bao gồm:
                - Không chứa lời nói căm ghét, kỳ thị, phân biệt chủng tộc, giới tính, tôn giáo,...
                - Không mang tính chất bạo lực, đe dọa, khủng bố.
                - Không chứa nội dung tình dục rõ ràng hoặc tục tĩu.
                - Không lan truyền tin giả, kích động, phản cảm, spam.

                Hãy trả lời theo định dạng JSON như sau:
                {
                  "is_violation": true|false,
                  "violation_types": ["hate_speech", "sexual", "violence", "spam", "inappropriate", "fake_news", "harassment", "impersonation"],
                  "explanation": "Giải thích ngắn gọn tại sao nội dung này bị cho là vi phạm"
                }

                Dưới đây là nội dung:

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

            // Send request
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    JsonNode.class
            );

            // Extract JSON from Gemini response
            String resultText = response.getBody()
                    .path("candidates").get(0)
                    .path("content")
                    .path("parts").get(0)
                    .path("text").asText();

            JsonNode resultNode = objectMapper.readTree(resultText);

            boolean isViolation = resultNode.get("is_violation").asBoolean();
            List<String> violationTypes = objectMapper.convertValue(resultNode.get("violation_types"), List.class);
            String explanation = resultNode.get("explanation").asText();

            // Mapping
            List<String> mappedViolationTypes = mapViolationTypesToReportReasons(violationTypes);

            return Optional.of(FlagResultDto.builder()
                    .isViolation(isViolation)
                    .violationTypes(mappedViolationTypes)
                    .explanation(explanation)
                    .build());

        } catch (Exception e) {
            log.error("Lỗi khi gọi Gemini API: {}", e.getMessage(), e);
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
