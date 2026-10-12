package com.gosafe.gosafe_backend.place.dto;

import com.gosafe.gosafe_backend.place.PlaceCategory;

import java.util.UUID;

/** Item da lista de locais (estilo iFood). */
public record PlaceSummaryDto(
        UUID id,
        String name,
        PlaceCategory category,
        String description,
        String profilePhotoUrl,
        String district,
        String city,
        double latitude,
        double longitude,
        Double weightedRating,
        int ratingCount,
        Double distanceMeters
) {
}
