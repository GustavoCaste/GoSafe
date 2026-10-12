package com.gosafe.gosafe_backend.place.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Por enquanto a foto é enviada como URL; o armazenamento ainda será definido. */
public record PhotoRequest(
        @NotBlank(message = "URL da foto é obrigatória")
        @Size(max = 500, message = "URL deve ter no máximo 500 caracteres")
        @Pattern(regexp = "^https?://.+", message = "URL da foto inválida")
        String url
) {
}
