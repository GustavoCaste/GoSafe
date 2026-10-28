package com.gosafe.gosafe_backend.place.dto;

/** Nota ponderada geral e por parâmetro; null quando ainda não há avaliações. */
public record PlaceStatsDto(
        Double rating,
        int ratingCount,
        Double safety,
        Double lighting,
        Double movement,
        Double welcoming,
        Double restroom
) {
}
