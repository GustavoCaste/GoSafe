package com.gosafe.gosafe_backend.geo.dto;

public record CoordinatesDto(
        double latitude,
        double longitude,
        String source,
        String displayName
) {
}
