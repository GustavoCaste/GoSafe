package com.gosafe.gosafe_backend.it;

import com.gosafe.gosafe_backend.geo.dto.CoordinatesDto;
import com.gosafe.gosafe_backend.user.Role;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.closeTo;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PlaceApiTest extends PostgisIntegrationTest {

    // ---------- cadastro ----------

    @Test
    void createWithManualPinNormalizesAddress() throws Exception {
        Account account = register();
        Point origin = nextOrigin();

        call(post("/places"), account, placeJson("Café " + unique("p"), origin))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.geocodeSource").value("MANUAL"))
                .andExpect(jsonPath("$.postalCode").value("01310-100"))
                .andExpect(jsonPath("$.state").value("SP"))
                .andExpect(jsonPath("$.latitude").value(origin.lat()))
                .andExpect(jsonPath("$.canEdit").value(true))
                .andExpect(jsonPath("$.createdById").value(account.id()))
                .andExpect(jsonPath("$.notRecommended").value(false))
                .andExpect(jsonPath("$.stats.ratingCount").value(0))
                .andExpect(jsonPath("$.stats.rating").doesNotExist());
    }

    @Test
    void createGeocodesAddressWhenNoPin() throws Exception {
        Account account = register();
        Point origin = nextOrigin();
        when(geocodingService.geocode(any(), any(), any(), any(), any(), any()))
                .thenReturn(Optional.of(new CoordinatesDto(origin.lat(), origin.lng(), "NOMINATIM", "x")));

        call(post("/places"), account, placeJson("Padaria " + unique("p"), null))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.geocodeSource").value("NOMINATIM"))
                .andExpect(jsonPath("$.latitude").value(origin.lat()));
    }

    @Test
    void createFailsWhenAddressCannotBeGeocoded() throws Exception {
        Account account = register();

        call(post("/places"), account, placeJson("Bar " + unique("p"), null))
                .andExpect(status().is(422))
                .andExpect(jsonPath("$.message").value(
                        "Não foi possível localizar o endereço; ajuste o pino no mapa e envie latitude/longitude"));
    }

    @Test
    void createValidatesInput() throws Exception {
        Account account = register();

        call(post("/places"), null, placeJson("Sem login", nextOrigin()))
                .andExpect(status().isUnauthorized());

        call(post("/places"), account, "{}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.name").exists())
                .andExpect(jsonPath("$.fields.category").exists())
                .andExpect(jsonPath("$.fields.postalCode").exists())
                .andExpect(jsonPath("$.fields.street").exists())
                .andExpect(jsonPath("$.fields.number").exists())
                .andExpect(jsonPath("$.fields.district").exists())
                .andExpect(jsonPath("$.fields.city").exists())
                .andExpect(jsonPath("$.fields.state").exists());

        String badAddress = placeJson("Local " + unique("p"), nextOrigin())
                .replace("01310100", "0131")
                .replace("\"sp\"", "\"SPX\"");
        call(post("/places"), account, badAddress)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.postalCode").exists())
                .andExpect(jsonPath("$.fields.state").exists());

        String onlyLatitude = placeJson("Local " + unique("p"), null)
                .replace("\"state\":\"sp\"", "\"state\":\"sp\",\"latitude\":-23.5");
        call(post("/places"), account, onlyLatitude)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Latitude e longitude devem ser informadas juntas"));

        call(post("/places"), account, placeJson("Local " + unique("p"), new Point(-95, -46.6)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.latitude").exists());

        call(post("/places"), account, placeJson("Local " + unique("p"), nextOrigin()).replace("CAFE", "BOATE"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void duplicateNameWithin50MetersIsRejected() throws Exception {
        Account account = register();
        Point origin = nextOrigin();
        String name = "Café Duplicado " + unique("p");

        createPlace(account, name, origin);

        call(post("/places"), account, placeJson(name.toUpperCase(), origin.north(30)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Já existe um local com esse nome a menos de 50 m"));

        // mesmo nome longe, ou outro nome perto, são permitidos
        createPlace(account, name, origin.north(200));
        createPlace(account, "Outro " + unique("p"), origin.north(10));
    }

    // ---------- edição e remoção ----------

    @Test
    void updatePermissions() throws Exception {
        Account owner = register();
        Account other = register();
        Account moderator = register(Role.MODERATOR);
        Point origin = nextOrigin();
        String id = createPlace(owner, "Original " + unique("p"), origin);

        call(put("/places/" + id), owner, placeJson("Renomeado " + unique("p"), origin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(startsWith("Renomeado")));

        call(put("/places/" + id), other, placeJson("Invasão " + unique("p"), origin))
                .andExpect(status().isForbidden());

        call(put("/places/" + id), moderator, placeJson("Moderado " + unique("p"), origin.north(5)))
                .andExpect(status().isOk());

        call(get("/places/" + id), other)
                .andExpect(jsonPath("$.canEdit").value(false));
    }

    @Test
    void updateKeepingSameNameAndPinIsNotADuplicate() throws Exception {
        Account owner = register();
        Point origin = nextOrigin();
        String name = "Mesmo Nome " + unique("p");
        String id = createPlace(owner, name, origin);

        call(put("/places/" + id), owner, placeJson(name, origin))
                .andExpect(status().isOk());
    }

    @Test
    void onlyModerationCanDeactivate() throws Exception {
        Account owner = register();
        Account moderator = register(Role.MODERATOR);
        String name = "Removível " + unique("p");
        String id = createPlace(owner, name, nextOrigin());

        call(delete("/places/" + id), owner).andExpect(status().isForbidden());
        call(delete("/places/" + id), moderator).andExpect(status().isNoContent());

        call(get("/places/" + id), null).andExpect(status().isNotFound());
        call(get("/places").param("q", name), null)
                .andExpect(jsonPath("$.totalElements").value(0));
        call(delete("/places/" + id), moderator).andExpect(status().isNotFound());
    }

    @Test
    void detailErrors() throws Exception {
        call(get("/places/" + UUID.randomUUID()), null)
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Local não encontrado"));

        call(get("/places/nao-e-uuid"), null)
                .andExpect(status().isBadRequest());
    }

    @Test
    void detailComputesDistanceFromViewer() throws Exception {
        Account account = register();
        Point origin = nextOrigin();
        String id = createPlace(account, "Distância " + unique("p"), origin);
        Point viewer = origin.north(250);

        call(get("/places/" + id)
                .param("lat", String.valueOf(viewer.lat()))
                .param("lng", String.valueOf(viewer.lng())), null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.distanceMeters").value(closeTo(250.0, 2.0)));
    }

    // ---------- mapa (PostGIS) ----------

    @Test
    void mapReturnsOnlyPinsInsideVisibleArea() throws Exception {
        Account account = register();
        Point origin = nextOrigin();
        String inside = createPlace(account, "Dentro " + unique("p"), origin);
        String bar = createPlace(account, "Bar Dentro " + unique("p"), "BAR", "Centro", origin.north(100));
        String outside = createPlace(account, "Fora " + unique("p"), origin.north(5000));

        call(mapRequest(origin), null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '" + inside + "')]").exists())
                .andExpect(jsonPath("$[?(@.id == '" + bar + "')]").exists())
                .andExpect(jsonPath("$[?(@.id == '" + outside + "')]").doesNotExist());

        call(mapRequest(origin).param("category", "BAR"), null)
                .andExpect(jsonPath("$[?(@.id == '" + bar + "')]").exists())
                .andExpect(jsonPath("$[?(@.id == '" + inside + "')]").doesNotExist());
    }

    private static org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder mapRequest(Point origin) {
        return get("/places/map")
                .param("minLng", String.valueOf(origin.lng() - 0.01))
                .param("minLat", String.valueOf(origin.lat() - 0.01))
                .param("maxLng", String.valueOf(origin.lng() + 0.01))
                .param("maxLat", String.valueOf(origin.lat() + 0.01));
    }

    @Test
    void mapValidatesArea() throws Exception {
        call(get("/places/map").param("minLng", "-46").param("minLat", "-23")
                .param("maxLng", "-47").param("maxLat", "-22"), null)
                .andExpect(status().isBadRequest());

        call(get("/places/map").param("minLng", "-46").param("minLat", "-100")
                .param("maxLng", "-45").param("maxLat", "-22"), null)
                .andExpect(status().isBadRequest());

        call(get("/places/map").param("minLng", "-46"), null)
                .andExpect(status().isBadRequest());
    }

    // ---------- busca ----------

    @Test
    void searchByDistanceOrdersNearestFirst() throws Exception {
        Account account = register();
        Point origin = nextOrigin();
        String token = unique("Perto");
        String far = createPlace(account, token + " Longe", origin.north(300));
        String near = createPlace(account, token + " Perto", origin.north(50));
        String middle = createPlace(account, token + " Meio", origin.north(150));

        call(get("/places").param("q", token.toLowerCase())
                .param("lat", String.valueOf(origin.lat())).param("lng", String.valueOf(origin.lng())), null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.content[0].id").value(near))
                .andExpect(jsonPath("$.content[1].id").value(middle))
                .andExpect(jsonPath("$.content[2].id").value(far))
                .andExpect(jsonPath("$.content[0].distanceMeters").value(closeTo(50.0, 2.0)));
    }

    @Test
    void searchByNameRatingAndFilters() throws Exception {
        Account account = register();
        Point origin = nextOrigin();
        String token = unique("Filtro");
        String zebra = createPlace(account, token + " Zebra", "BAR", "Pinheiros", origin);
        String alpha = createPlace(account, token + " Alpha", "CAFE", "Centro", origin.north(100));
        createNotice(account, zebra, reviewJson(5, 5, 5, 5, null));

        call(get("/places").param("q", token).param("sort", "NAME"), null)
                .andExpect(jsonPath("$.content[0].id").value(alpha))
                .andExpect(jsonPath("$.content[1].id").value(zebra));

        call(get("/places").param("q", token).param("sort", "RATING"), null)
                .andExpect(jsonPath("$.content[0].id").value(zebra))
                .andExpect(jsonPath("$.content[0].weightedRating").value(5.0))
                .andExpect(jsonPath("$.content[1].weightedRating").doesNotExist());

        call(get("/places").param("q", token).param("category", "BAR"), null)
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(zebra));

        call(get("/places").param("q", token).param("district", "centro").param("city", "são paulo"), null)
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(alpha));

        call(get("/places").param("q", token).param("size", "1").param("page", "1").param("sort", "NAME"), null)
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.content[0].id").value(zebra));
    }

    @Test
    void searchValidatesParameters() throws Exception {
        call(get("/places").param("lat", "-23.5"), null)
                .andExpect(status().isBadRequest());
        call(get("/places").param("sort", "DISTANCE"), null)
                .andExpect(status().isBadRequest());
        call(get("/places").param("sort", "ALEATORIO"), null)
                .andExpect(status().isBadRequest());
        call(get("/places").param("size", "51"), null)
                .andExpect(status().isBadRequest());
        call(get("/places").param("page", "-1"), null)
                .andExpect(status().isBadRequest());
    }

    // ---------- fotos ----------

    @Test
    void photos() throws Exception {
        Account account = register();
        String id = createPlace(account, "Com Fotos " + unique("p"), nextOrigin());

        call(post("/places/" + id + "/photos"), null, "{\"url\":\"https://img.test/1.jpg\"}")
                .andExpect(status().isUnauthorized());

        call(post("/places/" + id + "/photos"), account, "{\"url\":\"nao-e-url\"}")
                .andExpect(status().isBadRequest());

        call(post("/places/" + id + "/photos"), account, "{\"url\":\"https://img.test/1.jpg\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.position").value(0));
        call(post("/places/" + id + "/photos"), account, "{\"url\":\"https://img.test/2.jpg\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.position").value(1));

        call(get("/places/" + id + "/photos"), null)
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].url").value("https://img.test/2.jpg"));

        call(get("/places/" + id), null)
                .andExpect(jsonPath("$.profilePhotoUrl").value("https://img.test/1.jpg"))
                .andExpect(jsonPath("$.photos.length()").value(2));

        call(post("/places/" + UUID.randomUUID() + "/photos"), account, "{\"url\":\"https://img.test/3.jpg\"}")
                .andExpect(status().isNotFound());
    }
}
