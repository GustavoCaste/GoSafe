package com.gosafe.gosafe_backend.auth.dto;

import com.gosafe.gosafe_backend.user.Sex;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Nome é obrigatório")
        @Size(min = 3, max = 100, message = "Nome deve ter entre 3 e 100 caracteres")
        String name,

        @NotBlank(message = "Nome de usuária é obrigatório")
        @Pattern(regexp = "^[A-Za-z0-9._]{3,30}$", message = "Use de 3 a 30 letras, números, ponto ou sublinhado")
        String username,

        @NotBlank(message = "E-mail é obrigatório")
        @Email(message = "E-mail inválido")
        @Size(max = 150, message = "E-mail deve ter no máximo 150 caracteres")
        String email,

        @NotBlank(message = "Senha é obrigatória")
        @Size(min = 8, max = 72, message = "Senha deve ter entre 8 e 72 caracteres")
        String password,

        @NotNull(message = "Sexo é obrigatório")
        Sex sex
) {
}
