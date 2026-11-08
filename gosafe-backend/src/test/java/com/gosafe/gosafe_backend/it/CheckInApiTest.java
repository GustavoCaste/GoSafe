package com.gosafe.gosafe_backend.it;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.hamcrest.Matchers.closeTo;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CheckInApiTest extends PostgisIntegrationTest {

    private static String checkInJson(Point point, double accuracy) {
        return "{\"latitude\":" + point.lat() + ",\"longitude\":" + point.lng() + ",\"accuracyMeters\":" + accuracy + "}";
    }

    @Test
    void validCheckInIsRecordedWithDistanceOnly() throws Exception {
        Account account = register();
        Point origin = nextOrigin();
        String placeId = createPlace(account, "Check-in " + unique("p"), origin);

        call(post("/places/" + placeId + "/checkins"), account, checkInJson(origin.north(33), 10))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.placeId").value(placeId))
                .andExpect(jsonPath("$.distanceMeters").value(closeTo(33.0, 1.0)))
                .andExpect(jsonPath("$.validUntil").isNotEmpty())
                .andExpect(jsonPath("$.latitude").doesNotExist());

        call(get("/places/" + placeId), account)
                .andExpect(jsonPath("$.checkInValidUntil").isNotEmpty());

        call(get("/me/checkins"), account)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].placeId").value(placeId));
    }

    @Test
    void onlyOneCheckInPerPlaceWithinWindow() throws Exception {
        Account account = register();
        Point origin = nextOrigin();
        String placeId = createPlace(account, "Janela " + unique("p"), origin);

        call(post("/places/" + placeId + "/checkins"), account, checkInJson(origin, 5))
                .andExpect(status().isCreated());
        call(post("/places/" + placeId + "/checkins"), account, checkInJson(origin, 5))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Você já fez check-in neste local nas últimas 4 horas"));
    }

    @Test
    void radiusIs100MetersDiscountingGpsAccuracy() throws Exception {
        Account account = register();
        Point origin = nextOrigin();
        String placeId = createPlace(account, "Raio " + unique("p"), origin);

        call(post("/places/" + placeId + "/checkins"), account, checkInJson(origin.north(500), 10))
                .andExpect(status().is(422))
                .andExpect(jsonPath("$.message").value(containsString("o check-in exige até 100 m")));

        call(post("/places/" + placeId + "/checkins"), account, checkInJson(origin.north(120), 10))
                .andExpect(status().is(422));

        // 150 m de distância − 60 m de precisão = 90 m → válido
        call(post("/places/" + placeId + "/checkins"), account, checkInJson(origin.north(150), 60))
                .andExpect(status().isCreated());
    }

    @Test
    void poorGpsAccuracyIsRejected() throws Exception {
        Account account = register();
        Point origin = nextOrigin();
        String placeId = createPlace(account, "GPS " + unique("p"), origin);

        call(post("/places/" + placeId + "/checkins"), account, checkInJson(origin, 150))
                .andExpect(status().is(422))
                .andExpect(jsonPath("$.message").value(containsString("Precisão do GPS insuficiente")));
    }

    @Test
    void checkInValidation() throws Exception {
        Account account = register();
        Point origin = nextOrigin();
        String placeId = createPlace(account, "Validação " + unique("p"), origin);

        call(post("/places/" + placeId + "/checkins"), null, checkInJson(origin, 5))
                .andExpect(status().isUnauthorized());
        call(post("/places/" + placeId + "/checkins"), account, "{}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.latitude").exists())
                .andExpect(jsonPath("$.fields.longitude").exists())
                .andExpect(jsonPath("$.fields.accuracyMeters").exists());
        call(post("/places/" + placeId + "/checkins"), account, checkInJson(origin, -1))
                .andExpect(status().isBadRequest());
        call(post("/places/" + UUID.randomUUID() + "/checkins"), account, checkInJson(origin, 5))
                .andExpect(status().isNotFound());
    }

    @Test
    void reviewAfterCheckInGetsWeightBonus() throws Exception {
        Account withCheckIn = register();
        Account withoutCheckIn = register();
        Point origin = nextOrigin();
        String placeId = createPlace(withCheckIn, "Bônus " + unique("p"), origin);

        call(post("/places/" + placeId + "/checkins"), withCheckIn, checkInJson(origin, 5))
                .andExpect(status().isCreated());

        String json = body(call(post("/places/" + placeId + "/notices"), withCheckIn,
                noticeJson("Fui hoje e estava tudo bem", false, reviewJson(5, 5, 5, 5, 5)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.initialComment.review.withCheckIn").value(true)));
        String noticeId = JsonPath.read(json, "$.notice.id");

        call(post("/notices/" + noticeId + "/comments"), withoutCheckIn,
                commentJson("Não gostei", reviewJson(1, 1, 1, 1, 1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.review.withCheckIn").value(false));

        // pesos 0,25 (0,2 × 1,25) e 0,2 → (5×0,25 + 1×0,2) / 0,45 = 3,22
        call(get("/places/" + placeId), null)
                .andExpect(jsonPath("$.stats.rating").value(3.22))
                .andExpect(jsonPath("$.stats.ratingCount").value(2));
    }
}
