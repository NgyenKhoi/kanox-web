package com.example.social_media.repository;

import com.example.social_media.entity.UserRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserRegistrationRepository extends JpaRepository<UserRegistration, Integer> {
    @Procedure(procedureName = "sp_GetUserRegistrationsByWeek")
    List<Object[]> getUserRegistrationsByWeek(
            @Param("StartYear") Integer startYear,
            @Param("EndYear") Integer endYear
    );
}