package com.gosafe.gosafe_backend.it;

import com.gosafe.gosafe_backend.user.Role;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FavoriteApiTest extends PostgisIntegrationTest {

    @Test
    void favoriteLifecycle() throws Exception {
        Account account = register();
        String placeId = createPlace(account, "Favorito " + unique("p"), nextOrigin());

        call(put("/places/" + placeId + "/favorite"), null).andExpect(status().isUnauthorized());

        call(put("/places/" + placeId + "/favorite"), account).andExpect(status().isNoContent());
        call(put("/places/" + placeId + "/favorite"), account).andExpect(status().isNoContent());

        call(get("/me/favorites"), account)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(placeId));

        call(get("/places/" + placeId), account).andExpect(jsonPath("$.favorite").value(true));

        call(delete("/places/" + placeId + "/favorite"), account).andExpect(status().isNoContent());
        call(delete("/places/" + placeId + "/favorite"), account).andExpect(status().isNoContent());

        call(get("/me/favorites"), account).andExpect(jsonPath("$.length()").value(0));
        call(get("/places/" + placeId), account).andExpect(jsonPath("$.favorite").value(false));
    }

    @Test
    void favoritingUnknownPlaceFails() throws Exception {
        Account account = register();

        call(put("/places/" + UUID.randomUUID() + "/favorite"), account).andExpect(status().isNotFound());
    }

    @Test
    void deactivatedPlacesLeaveFavoritesList() throws Exception {
        Account account = register();
        Account moderator = register(Role.MODERATOR);
        String placeId = createPlace(account, "Some " + unique("p"), nextOrigin());

        call(put("/places/" + placeId + "/favorite"), account).andExpect(status().isNoContent());
        call(delete("/places/" + placeId), moderator).andExpect(status().isNoContent());

        call(get("/me/favorites"), account).andExpect(jsonPath("$.length()").value(0));
    }
}
