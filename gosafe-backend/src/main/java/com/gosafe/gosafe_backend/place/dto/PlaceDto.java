package com.gosafe.gosafe_backend.place.dto;

import java.util.UUID;

public record PlaceDto(
        UUID id,
        String name,
        String category,
        String address,
        Double latitude,
        Double longitude,
        Boolean active
) {
}
