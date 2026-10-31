package com.gosafe.gosafe_backend.checkin.dto;

import java.time.Instant;
import java.util.UUID;

public record CheckInDto(
        UUID id,
        UUID placeId,
        String placeName,
        double distanceMeters,
        Instant createdAt,
        Instant validUntil
) {
}
