package com.gosafe.gosafe_backend.verification.dto;

import com.gosafe.gosafe_backend.verification.VerificationStatus;

import java.time.Instant;
import java.util.UUID;

public record VerificationDto(
        UUID id,
        VerificationStatus status,
        String provider,
        boolean livenessOk,
        double facematchScore,
        Instant consentAt,
        Instant validatedAt
) {
}
