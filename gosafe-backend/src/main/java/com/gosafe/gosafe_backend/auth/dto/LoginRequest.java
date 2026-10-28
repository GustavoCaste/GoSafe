package com.gosafe.gosafe_backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Informe e-mail ou nome de usuária")
        String login,

        @NotBlank(message = "Senha é obrigatória")
        String password
) {
}
