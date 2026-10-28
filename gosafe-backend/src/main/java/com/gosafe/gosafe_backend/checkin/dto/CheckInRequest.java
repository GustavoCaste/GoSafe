package com.gosafe.gosafe_backend.checkin.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/** Posição atual da usuária; usada só para calcular a distância e descartada. */
public record CheckInRequest(
        @NotNull(message = "Latitude é obrigatória")
        @DecimalMin(value = "-90", message = "Latitude deve estar entre -90 e 90")
        @DecimalMax(value = "90", message = "Latitude deve estar entre -90 e 90")
        Double latitude,

        @NotNull(message = "Longitude é obrigatória")
        @DecimalMin(value = "-180", message = "Longitude deve estar entre -180 e 180")
        @DecimalMax(value = "180", message = "Longitude deve estar entre -180 e 180")
        Double longitude,

        @NotNull(message = "Precisão do GPS é obrigatória")
        @PositiveOrZero(message = "Precisão do GPS não pode ser negativa")
        Double accuracyMeters
) {
}
