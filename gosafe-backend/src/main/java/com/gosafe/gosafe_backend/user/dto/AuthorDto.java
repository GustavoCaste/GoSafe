package com.gosafe.gosafe_backend.user.dto;

import com.gosafe.gosafe_backend.user.User;

import java.util.UUID;

/**
 * Autora exibida publicamente. Em conteúdo anônimo a identidade é ocultada,
 * mas o vínculo continua guardado no banco para moderação.
 */
public record AuthorDto(
        UUID id,
        String name,
        String username,
        boolean verified,
        boolean anonymous,
        boolean mine
) {

    public static AuthorDto of(User author, boolean anonymous, UUID viewerId) {
        boolean mine = viewerId != null && viewerId.equals(author.getId());

        if (anonymous) {
            return new AuthorDto(null, "Anônima", null, author.getVerified(), true, mine);
        }

        return new AuthorDto(
                author.getId(),
                author.getName(),
                author.getUsername(),
                author.getVerified(),
                false,
                mine
        );
    }
}
