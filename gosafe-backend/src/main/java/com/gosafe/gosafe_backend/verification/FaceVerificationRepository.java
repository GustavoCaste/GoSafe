package com.gosafe.gosafe_backend.verification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FaceVerificationRepository extends JpaRepository<FaceVerification, UUID> {

    Optional<FaceVerification> findFirstByUser_IdOrderByCreatedAtDesc(UUID userId);
}
