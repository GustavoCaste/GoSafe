package com.gosafe.gosafe_backend.it;

import com.gosafe.gosafe_backend.user.User;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthApiTest extends PostgisIntegrationTest {

    @Test
    void registerReturnsTokenAndNormalizedUser() throws Exception {
        String username = unique("Maria.Upper");

        call(post("/auth/register"), null,
                registerJson("Maria", username, username.toUpperCase() + "@GoSafe.Test", "senha-forte-1"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.expiresAt").isNotEmpty())
                .andExpect(jsonPath("$.user.username").value(username.toLowerCase()))
                .andExpect(jsonPath("$.user.email").value(username.toLowerCase() + "@gosafe.test"))
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andExpect(jsonPath("$.user.verified").value(false))
                .andExpect(jsonPath("$.user.reputationWeight").value(0.2))
                .andExpect(jsonPath("$.user.password").doesNotExist())
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    void registerValidatesEveryField() throws Exception {
        call(post("/auth/register"), null, "{}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Dados inválidos"))
                .andExpect(jsonPath("$.fields.name").exists())
                .andExpect(jsonPath("$.fields.username").exists())
                .andExpect(jsonPath("$.fields.email").exists())
                .andExpect(jsonPath("$.fields.password").exists())
                .andExpect(jsonPath("$.fields.sex").exists());

        call(post("/auth/register"), null, registerJson("Maria", "com espaco", "nao-e-email", "1234567"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.username").exists())
                .andExpect(jsonPath("$.fields.email").exists())
                .andExpect(jsonPath("$.fields.password").exists());
    }

    @Test
    void registerRejectsUnknownSexAndMalformedJson() throws Exception {
        call(post("/auth/register"), null,
                "{\"name\":\"Maria\",\"username\":\"maria.x\",\"email\":\"x@y.com\",\"password\":\"senha-forte-1\",\"sex\":\"XYZ\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Corpo da requisição inválido"));

        call(post("/auth/register"), null, "{nao é json")
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerRejectsDuplicateEmailAndUsernameIgnoringCase() throws Exception {
        Account account = register();

        call(post("/auth/register"), null,
                registerJson("Outra", unique("outra"), account.email().toUpperCase(), "senha-forte-1"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("E-mail já cadastrado"));

        call(post("/auth/register"), null,
                registerJson("Outra", account.username().toUpperCase(), unique("outra") + "@gosafe.test", "senha-forte-1"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Nome de usuária já está em uso"));
    }

    @Test
    void configuredAdminEmailReceivesAdminRole() throws Exception {
        call(post("/auth/register"), null, registerJson("Admin", unique("admin"), "admin@gosafe.test", "senha-forte-1"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("ADMIN"));
    }

    @Test
    void loginByEmailOrUsername() throws Exception {
        Account account = register();

        call(post("/auth/login"), null, "{\"login\":\"" + account.email() + "\",\"password\":\"senha-forte-1\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.id").value(account.id()));

        call(post("/auth/login"), null,
                "{\"login\":\"" + account.username().toUpperCase() + "\",\"password\":\"senha-forte-1\"}")
                .andExpect(status().isOk());
    }

    @Test
    void loginFailsWithWrongPasswordUnknownUserOrMissingFields() throws Exception {
        Account account = register();

        call(post("/auth/login"), null, "{\"login\":\"" + account.email() + "\",\"password\":\"errada-123\"}")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Credenciais inválidas"));

        call(post("/auth/login"), null, "{\"login\":\"ninguem@gosafe.test\",\"password\":\"senha-forte-1\"}")
                .andExpect(status().isUnauthorized());

        call(post("/auth/login"), null, "{}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.login").exists())
                .andExpect(jsonPath("$.fields.password").exists());
    }

    @Test
    void deactivatedAccountCannotLoginNorUseItsToken() throws Exception {
        Account account = register();
        User user = userRepository.findById(UUID.fromString(account.id())).orElseThrow();
        user.setActive(false);
        userRepository.save(user);

        call(post("/auth/login"), null, "{\"login\":\"" + account.email() + "\",\"password\":\"senha-forte-1\"}")
                .andExpect(status().isUnauthorized());
        call(get("/me"), account)
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedRoutesRequireValidToken() throws Exception {
        call(get("/me"), null)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Autenticação necessária"));

        call(get("/me"), new Account("token-invalido", null, null, null))
                .andExpect(status().isUnauthorized());

        Account account = register();
        String tampered = account.token().substring(0, account.token().length() - 2) + "xx";
        call(get("/me"), new Account(tampered, null, null, null))
                .andExpect(status().isUnauthorized());
    }
}
