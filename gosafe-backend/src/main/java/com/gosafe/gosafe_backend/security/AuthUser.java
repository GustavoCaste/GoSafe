package com.gosafe.gosafe_backend.security;

import com.gosafe.gosafe_backend.user.Role;

import java.util.UUID;

/**
 * Usuária autenticada, extraída do token JWT. A autoria de qualquer conteúdo
 * vem sempre daqui, nunca do corpo da requisição.
 */
public record AuthUser(UUID id, String email, Role role) {

    public boolean isModerator() {
        return role == Role.MODERATOR || role == Role.ADMIN;
    }
}
