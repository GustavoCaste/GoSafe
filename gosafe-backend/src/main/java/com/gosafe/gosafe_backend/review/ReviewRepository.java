package com.gosafe.gosafe_backend.review;

import com.gosafe.gosafe_backend.common.ContentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    /** Avaliações de comentários e avisos ainda visíveis, mais recentes primeiro. */
    @Query("""
            SELECT r FROM Review r
            JOIN r.comment c
            JOIN c.notice n
            WHERE r.place.id = :placeId
              AND c.status = :status
              AND n.status = :status
            ORDER BY r.createdAt DESC
            """)
    List<Review> findVisibleByPlace(@Param("placeId") UUID placeId, @Param("status") ContentStatus status);

    List<Review> findByComment_IdIn(Collection<UUID> commentIds);
}
