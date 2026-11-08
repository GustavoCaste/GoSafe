package com.gosafe.gosafe_backend.it;

import com.gosafe.gosafe_backend.user.Role;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MeApiTest extends PostgisIntegrationTest {

    @Test
    void getMe() throws Exception {
        Account account = register();

        call(get("/me"), account)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(account.id()))
                .andExpect(jsonPath("$.email").value(account.email()))
                .andExpect(jsonPath("$.sex").value("FEMALE"))
                .andExpect(jsonPath("$.validContributions").value(0));
    }

    @Test
    void updateProfile() throws Exception {
        Account account = register();
        String newUsername = unique("Novo.Nome");

        call(put("/me"), account, """
                {"name":"Nome Atualizado","username":"%s","photoUrl":"https://img.test/foto.jpg"}
                """.formatted(newUsername))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Nome Atualizado"))
                .andExpect(jsonPath("$.username").value(newUsername.toLowerCase()))
                .andExpect(jsonPath("$.photoUrl").value("https://img.test/foto.jpg"));

        // manter o próprio username não é conflito
        call(put("/me"), account, """
                {"name":"Nome Atualizado","username":"%s"}
                """.formatted(newUsername))
                .andExpect(status().isOk());
    }

    @Test
    void updateProfileRejectsTakenUsernameAndInvalidData() throws Exception {
        Account account = register();
        Account other = register();

        call(put("/me"), account, """
                {"name":"Nome","username":"%s"}
                """.formatted(other.username()))
                .andExpect(status().isConflict());

        call(put("/me"), account, """
                {"name":"N","username":"a b","photoUrl":"ftp://foto"}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.name").exists())
                .andExpect(jsonPath("$.fields.username").exists())
                .andExpect(jsonPath("$.fields.photoUrl").exists());
    }

    @Test
    void changePassword() throws Exception {
        Account account = register();

        call(put("/me/password"), account, "{\"currentPassword\":\"errada-123\",\"newPassword\":\"nova-senha-1\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Senha atual incorreta"));

        call(put("/me/password"), account, "{\"currentPassword\":\"senha-forte-1\",\"newPassword\":\"curta\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.newPassword").exists());

        call(put("/me/password"), account, "{\"currentPassword\":\"senha-forte-1\",\"newPassword\":\"nova-senha-1\"}")
                .andExpect(status().isNoContent());

        call(post("/auth/login"), null, "{\"login\":\"" + account.email() + "\",\"password\":\"senha-forte-1\"}")
                .andExpect(status().isUnauthorized());
        call(post("/auth/login"), null, "{\"login\":\"" + account.email() + "\",\"password\":\"nova-senha-1\"}")
                .andExpect(status().isOk());
    }

    @Test
    void deactivateAccountInvalidatesToken() throws Exception {
        Account account = register();

        call(delete("/me"), account).andExpect(status().isNoContent());
        call(get("/me"), account).andExpect(status().isUnauthorized());
    }

    @Test
    void adminUserListIsAdminOnly() throws Exception {
        Account user = register();
        Account moderator = register(Role.MODERATOR);
        Account admin = register(Role.ADMIN);

        call(get("/admin/users"), null).andExpect(status().isUnauthorized());
        call(get("/admin/users"), user).andExpect(status().isForbidden());
        call(get("/admin/users"), moderator).andExpect(status().isForbidden());

        call(get("/admin/users").param("size", "2"), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].passwordHash").doesNotExist());

        call(get("/admin/users").param("size", "500"), admin)
                .andExpect(status().isBadRequest());
    }
}
