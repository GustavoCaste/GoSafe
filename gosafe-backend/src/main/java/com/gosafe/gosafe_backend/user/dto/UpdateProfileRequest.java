package com.gosafe.gosafe_backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Nome é obrigatório")
        @Size(min = 3, max = 100, message = "Nome deve ter entre 3 e 100 caracteres")
        String name,

        @NotBlank(message = "Nome de usuária é obrigatório")
        @Pattern(regexp = "^[A-Za-z0-9._]{3,30}$", message = "Use de 3 a 30 letras, números, ponto ou sublinhado")
        String username,

        @Size(max = 500, message = "URL da foto deve ter no máximo 500 caracteres")
        @Pattern(regexp = "^https?://.+", message = "URL da foto inválida")
        String photoUrl
) {
}
