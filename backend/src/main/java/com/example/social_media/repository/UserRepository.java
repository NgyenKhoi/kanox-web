package com.example.social_media.repository;

import com.example.social_media.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmailAndStatusTrue(String email);
    Optional<User> findByUsernameAndStatusTrue(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findById(Integer id);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    
    // Methods to check both status and isLocked
    Optional<User> findByEmailAndStatusTrueAndIsLockedFalse(String email);
    Optional<User> findByUsernameAndStatusTrueAndIsLockedFalse(String username);
    Optional<User> findByEmailAndStatusTrueAndIsLockedFalseOrIsLockedIsNull(String email);
    Optional<User> findByUsernameAndStatusTrueAndIsLockedFalseOrIsLockedIsNull(String username);
    Optional<User> findByIdAndStatusTrueAndIsLockedFalseOrIsLockedIsNull(Integer id);

    Page<User> findByEmailContainingOrUsernameContainingOrDisplayNameContaining(
            String email, String username, String displayName, Pageable pageable);

    @Procedure(procedureName = "dbo.sp_UpdateProfilePrivacy")
    void updateProfilePrivacy(Integer userId, String privacySetting, Integer customListId);

    long count();

    Optional<User> findFirstByIsSystemTrue();

    List<User> findAllByIsAdminTrue();
}