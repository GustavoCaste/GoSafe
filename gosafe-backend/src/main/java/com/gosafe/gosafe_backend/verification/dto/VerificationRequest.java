package com.gosafe.gosafe_backend.verification.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

public record VerificationRequest(
        @NotNull(message = "Consentimento é obrigatório")
        @AssertTrue(message = "É necessário consentir com o uso da imagem para a verificação")
        Boolean consent
) {
}
