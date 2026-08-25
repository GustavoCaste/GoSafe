package com.gosafe.gosafe_backend.review.dto;

import java.util.UUID;

public record ReviewDto(
        UUID id,
        UUID userId,
        UUID placeId,
        String safetyPerception,
        String comment
) {
}
