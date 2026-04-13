package com.soulsound.repository;

import com.soulsound.entity.User;
import com.soulsound.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    Page<User> findByFullNameContainingIgnoreCase(String name, Pageable pageable);

    Page<User> findByStatus(UserStatus status, Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u WHERE u.status = 'ACTIVE'")
    long countActiveUsers();


    // Lấy danh sách ID những người đang được follow
    @Query("SELECT u.id FROM User follower JOIN follower.following u WHERE follower.id = :userId")
    Set<Long> findFollowingIdsByUserId(@Param("userId") Long userId);


    // Load user + followers
    @Query("SELECT u FROM User u " +
            "LEFT JOIN FETCH u.followers " +
            "WHERE u.id = :id")
    Optional<User> findByIdWithFollowers(@Param("id") Long id);


    // Load user + following
    @Query("SELECT u FROM User u " +
            "LEFT JOIN FETCH u.following " +
            "WHERE u.id = :id")
    Optional<User> findByIdWithFollowing(@Param("id") Long id);


    // Suggested users
    @Query("SELECT DISTINCT u FROM User u " +
            "LEFT JOIN u.followers f " +
            "WHERE u.id <> :userId " +
            "ORDER BY SIZE(u.followers) DESC")
    List<User> findSuggestedUsers(
            @Param("userId") Long userId,
            Pageable pageable
    );
}