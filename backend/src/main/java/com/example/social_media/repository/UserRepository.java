package com.example.social_media.repository;

import com.example.social_media.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmailAndStatusTrue(String email);
    Optional<User> findByPersistentCookie(String persistentCookie);
    Optional<User> findByGoogleId(String googleId);
    Optional<User> findByUsernameAndStatusTrue(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findById(Integer id);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    Optional<User> findByIdAndStatusTrue(Integer id);

    @Procedure(procedureName = "dbo.sp_UpdateProfilePrivacy") // Chỉ rõ schema
    void updateProfilePrivacy(Integer userId, String privacySetting, Integer customListId);
}