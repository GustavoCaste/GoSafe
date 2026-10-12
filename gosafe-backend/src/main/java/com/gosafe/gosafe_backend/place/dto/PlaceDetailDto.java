package com.gosafe.gosafe_backend.place.dto;

import com.gosafe.gosafe_backend.place.GeocodeSource;
import com.gosafe.gosafe_backend.place.PlaceCategory;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PlaceDetailDto(
        UUID id,
        String name,
        PlaceCategory category,
        String description,
        String profilePhotoUrl,
        String postalCode,
        String street,
        String number,
        String complement,
        String district,
        String city,
        String state,
        double latitude,
        double longitude,
        GeocodeSource geocodeSource,
        PlaceStatsDto stats,
        List<PhotoDto> photos,
        Double distanceMeters,
        boolean favorite,
        Instant checkInValidUntil,
        UUID createdById,
        boolean canEdit
) {
}
