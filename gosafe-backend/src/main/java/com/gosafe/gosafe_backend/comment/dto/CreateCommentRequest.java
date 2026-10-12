package com.gosafe.gosafe_backend.comment.dto;

import com.gosafe.gosafe_backend.review.dto.ReviewRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCommentRequest(
        @NotBlank(message = "Comentário é obrigatório")
        @Size(max = 1000, message = "Comentário deve ter no máximo 1000 caracteres")
        String body,

        Boolean anonymous,

        @Valid
        ReviewRequest review
) {
}
