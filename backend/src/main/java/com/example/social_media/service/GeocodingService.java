package com.example.social_media.service;

import com.google.maps.GeoApiContext;
import com.google.maps.GeocodingApi;
import com.google.maps.model.GeocodingResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GeocodingService {
    private static final Logger logger = LoggerFactory.getLogger(GeocodingService.class);
    private final GeoApiContext context;

    public GeocodingService(@Value("${google.maps.api.key}") String apiKey) {
        this.context = new GeoApiContext.Builder()
                .apiKey(apiKey)
                .build();
    }

    public GeocodingResult[] geocodeAddress(String address) throws Exception {
        logger.debug("Geocoding address: {}", address);
        try {
            GeocodingResult[] results = GeocodingApi.geocode(context, address).await();
            if (results.length == 0) {
                logger.warn("No geocoding results for address: {}", address);
                throw new Exception("No geocoding results for address: " + address);
            }
            logger.debug("Geocoding successful for address: {}. Found {} results.", address, results.length);
            return results;
        } catch (Exception e) {
            logger.error("Geocoding error for address {}: {}", address, e.getMessage());
            throw e;
        }
    }
}