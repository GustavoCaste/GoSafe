package com.gosafe.gosafe_backend.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCommentRequest(
        @NotBlank(message = "Comentário é obrigatório")
        @Size(max = 1000, message = "Comentário deve ter no máximo 1000 caracteres")
        String body
) {
}
