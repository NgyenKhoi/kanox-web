package com.example.social_media.dto.user;

public class UserRegistrationStatsDTO {
    private Integer year;
    private Integer week;
    private String yearWeek;
    private Long userCount;

    public UserRegistrationStatsDTO(Integer year, Integer week, String yearWeek, Long userCount) {
        this.year = year;
        this.week = week;
        this.yearWeek = yearWeek;
        this.userCount = userCount;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public Integer getWeek() {
        return week;
    }

    public void setWeek(Integer week) {
        this.week = week;
    }

    public String getYearWeek() {
        return yearWeek;
    }

    public void setYearWeek(String yearWeek) {
        this.yearWeek = yearWeek;
    }

    public Long getUserCount() {
        return userCount;
    }

    public void setUserCount(Long userCount) {
        this.userCount = userCount;
    }
}