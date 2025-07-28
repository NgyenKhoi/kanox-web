package com.example.social_media.service;

import com.example.social_media.dto.user.UserRegistrationStatsDTO;
import com.example.social_media.repository.UserRegistrationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserRegistrationService {

    private final UserRegistrationRepository userRegistrationRepository;

    public UserRegistrationService(UserRegistrationRepository userRegistrationRepository) {
        this.userRegistrationRepository = userRegistrationRepository;
    }

    @Transactional(readOnly = true)
    public List<UserRegistrationStatsDTO> getUserRegistrationsByWeek(Integer startYear, Integer endYear) {
        List<Object[]> results = userRegistrationRepository.getUserRegistrationsByWeek(startYear, endYear);
        return results.stream()
                .map(result -> new UserRegistrationStatsDTO(
                        (Integer) result[0], // Year
                        (Integer) result[1], // Week
                        (String) result[2],  // YearWeek
                        ((Number) result[3]).longValue() // UserCount
                ))
                .collect(Collectors.toList());
    }
}