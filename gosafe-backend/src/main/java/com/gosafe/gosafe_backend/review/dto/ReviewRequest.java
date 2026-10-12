package com.gosafe.gosafe_backend.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Os 5 parâmetros de avaliação; banheiro nulo = "não há". */
public record ReviewRequest(
        @NotNull(message = "Segurança é obrigatória")
        @Min(value = 1, message = "Notas vão de 1 a 5")
        @Max(value = 5, message = "Notas vão de 1 a 5")
        Integer safety,

        @NotNull(message = "Iluminação é obrigatória")
        @Min(value = 1, message = "Notas vão de 1 a 5")
        @Max(value = 5, message = "Notas vão de 1 a 5")
        Integer lighting,

        @NotNull(message = "Movimento é obrigatório")
        @Min(value = 1, message = "Notas vão de 1 a 5")
        @Max(value = 5, message = "Notas vão de 1 a 5")
        Integer movement,

        @NotNull(message = "Acolhimento é obrigatório")
        @Min(value = 1, message = "Notas vão de 1 a 5")
        @Max(value = 5, message = "Notas vão de 1 a 5")
        Integer welcoming,

        @Min(value = 1, message = "Notas vão de 1 a 5")
        @Max(value = 5, message = "Notas vão de 1 a 5")
        Integer restroom
) {
}
