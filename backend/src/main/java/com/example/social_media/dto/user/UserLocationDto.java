package com.example.social_media.dto.user;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class UserLocationDto {
    @Min(-90) @Max(90)
    private Double latitude;
    @Min(-180) @Max(180)
    private Double longitude;
    private String locationName;

    // Getters và setters
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }
}