package com.gosafe.gosafe_backend.it;

import com.gosafe.gosafe_backend.place.SafetyAlert;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * RN18 com a configuração de teste: mínimo de 5 usuárias avaliando e nota
 * ponderada até 1,5. Em produção o mínimo é 100 (application.properties).
 */
class SafetyAlertApiTest extends PostgisIntegrationTest {

    @Test
    void placeBecomesNotRecommendedOnlyAfterEnoughLowReviews() throws Exception {
        Account first = register();
        Point origin = nextOrigin();
        String placeId = createPlace(first, "Perigoso " + unique("p"), origin);
        String noticeId = createNotice(first, placeId, reviewJson(1, 1, 1, 1, 1))[0];

        // 4 avaliações quase nulas: nota baixa, mas ainda abaixo do mínimo de usuárias
        for (int i = 0; i < 3; i++) {
            createComment(register(), noticeId, reviewJson(1, 1, 2, 1, null));
        }

        call(get("/places/" + placeId), null)
                .andExpect(jsonPath("$.stats.ratingCount").value(4))
                .andExpect(jsonPath("$.notRecommended").value(false))
                .andExpect(jsonPath("$.alertMessage").doesNotExist());

        // a 5ª usuária completa o mínimo
        Account fifth = register();
        String fifthComment = createComment(fifth, noticeId, reviewJson(1, 1, 1, 1, 1));

        call(get("/places/" + placeId), null)
                .andExpect(jsonPath("$.stats.ratingCount").value(5))
                .andExpect(jsonPath("$.notRecommended").value(true))
                .andExpect(jsonPath("$.alertMessage").value(SafetyAlert.MESSAGE));

        call(get("/places").param("q", "Perigoso"), null)
                .andExpect(jsonPath("$.content[?(@.id == '" + placeId + "')].notRecommended").value(true));

        call(get("/places/map")
                .param("minLng", String.valueOf(origin.lng() - 0.01))
                .param("minLat", String.valueOf(origin.lat() - 0.01))
                .param("maxLng", String.valueOf(origin.lng() + 0.01))
                .param("maxLat", String.valueOf(origin.lat() + 0.01)), null)
                .andExpect(jsonPath("$[?(@.id == '" + placeId + "')].notRecommended").value(true));

        // se uma avaliação sai, o local volta a ficar abaixo do mínimo e o alerta some
        call(delete("/comments/" + fifthComment), fifth).andExpect(status().isNoContent());
        call(get("/places/" + placeId), null)
                .andExpect(jsonPath("$.notRecommended").value(false));
    }

    @Test
    void manyReviewsWithMediumRatingDoNotTriggerAlert() throws Exception {
        Account first = register();
        String placeId = createPlace(first, "Mediano " + unique("p"), nextOrigin());
        String noticeId = createNotice(first, placeId, reviewJson(3, 3, 3, 3, 3))[0];

        for (int i = 0; i < 5; i++) {
            createComment(register(), noticeId, reviewJson(2, 2, 2, 2, null));
        }

        call(get("/places/" + placeId), null)
                .andExpect(jsonPath("$.stats.ratingCount").value(6))
                .andExpect(jsonPath("$.notRecommended").value(false));
    }
}
