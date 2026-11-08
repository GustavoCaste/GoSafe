package com.gosafe.gosafe_backend.favorite;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FavoriteRepository extends JpaRepository<Favorite, UUID> {

    boolean existsByUser_IdAndPlace_Id(UUID userId, UUID placeId);

    Optional<Favorite> findByUser_IdAndPlace_Id(UUID userId, UUID placeId);

    @Query("""
            SELECT f FROM Favorite f
            JOIN FETCH f.place p
            WHERE f.user.id = :userId AND p.active = TRUE
            ORDER BY f.createdAt DESC
            """)
    List<Favorite> findActiveByUser(@Param("userId") UUID userId);
}
