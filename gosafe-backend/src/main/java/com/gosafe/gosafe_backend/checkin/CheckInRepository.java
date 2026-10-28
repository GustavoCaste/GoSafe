package com.gosafe.gosafe_backend.checkin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface CheckInRepository extends JpaRepository<CheckIn, UUID> {

    Optional<CheckIn> findFirstByUser_IdAndPlace_IdAndValidTrueAndCreatedAtAfterOrderByCreatedAtDesc(
            UUID userId,
            UUID placeId,
            Instant after
    );

    @EntityGraph(attributePaths = "place")
    Page<CheckIn> findByUser_IdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
}
