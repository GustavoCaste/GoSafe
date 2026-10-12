package com.gosafe.gosafe_backend.place.dto;

import com.gosafe.gosafe_backend.place.PlaceCategory;

import java.util.UUID;

/** Pin do mapa: só o necessário para desenhar e colorir pela nota. */
public record PlacePinDto(
        UUID id,
        String name,
        PlaceCategory category,
        double latitude,
        double longitude,
        Double weightedRating,
        int ratingCount
) {
}
