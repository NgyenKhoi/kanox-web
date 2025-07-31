package com.example.social_media.service.AI;

import com.example.social_media.dto.post.FlagResultDto;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.vision.v1.*;
import com.google.protobuf.ByteString;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.google.cloud.vision.v1.Likelihood;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class VisionModerationService {

    private final RestTemplate restTemplate = new RestTemplate();

    public Optional<FlagResultDto> analyzeImage(String imageUrl) {
        try {
            // ✅ Load credentials giống như trong Gemini
            InputStream credentialsStream = getClass().getClassLoader().getResourceAsStream("gcp-secret-credentials.json");
            GoogleCredentials credentials = GoogleCredentials
                    .fromStream(credentialsStream)
                    .createScoped("https://www.googleapis.com/auth/cloud-platform");
            credentials.refreshIfExpired();
            AccessToken token = credentials.getAccessToken();

            // ✅ Load ảnh từ URL
            byte[] imageBytes = restTemplate.getForObject(imageUrl, byte[].class);
            if (imageBytes == null) {
                throw new IllegalArgumentException("Không thể tải ảnh từ URL: " + imageUrl);
            }

            ByteString imgBytes = ByteString.copyFrom(imageBytes);
            Image image = Image.newBuilder().setContent(imgBytes).build();

            Feature feature = Feature.newBuilder()
                    .setType(Feature.Type.SAFE_SEARCH_DETECTION)
                    .build();

            AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                    .setImage(image)
                    .addFeatures(feature)
                    .build();

            // ✅ Gọi Vision API với credentials được cấu hình
            try (ImageAnnotatorClient vision = ImageAnnotatorClient.create(
                    ImageAnnotatorSettings.newBuilder()
                            .setCredentialsProvider(() -> credentials)
                            .build()
            )) {
                List<AnnotateImageResponse> responses = vision.batchAnnotateImages(List.of(request)).getResponsesList();
                if (responses.isEmpty()) return Optional.empty();

                SafeSearchAnnotation annotation = responses.get(0).getSafeSearchAnnotation();
                log.info("🔍 SafeSearch: adult={}, violence={}, racy={}",
                        annotation.getAdult(), annotation.getViolence(), annotation.getRacy());

                List<String> violationTypes = new ArrayList<>();
                if (isLikelyOrWorse(annotation.getAdult())) violationTypes.add("sexual");
                if (isLikelyOrWorse(annotation.getViolence())) violationTypes.add("violence");
                if (isLikelyOrWorse(annotation.getRacy())) violationTypes.add("inappropriate");

                boolean isViolation = !violationTypes.isEmpty();

                return Optional.of(FlagResultDto.builder()
                        .isViolation(isViolation)
                        .violationTypes(violationTypes)
                        .explanation("Phát hiện nội dung vi phạm: " + String.join(", ", violationTypes))
                        .build());
            }

        } catch (Exception e) {
            log.error("❌ Lỗi Vision API: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }

    private boolean isLikelyOrWorse(Likelihood likelihood) {
        return likelihood == Likelihood.LIKELY
                || likelihood == Likelihood.VERY_LIKELY
                || likelihood == Likelihood.POSSIBLE;
    }
}
