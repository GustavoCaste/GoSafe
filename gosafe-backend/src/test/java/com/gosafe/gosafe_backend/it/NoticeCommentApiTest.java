package com.gosafe.gosafe_backend.it;

import com.gosafe.gosafe_backend.user.Role;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class NoticeCommentApiTest extends PostgisIntegrationTest {

    // ---------- avisos ----------

    @Test
    void createNoticeWithoutReviewDoesNotAffectRating() throws Exception {
        Account account = register();
        String placeId = createPlace(account, "Sem nota " + unique("p"), nextOrigin());

        call(post("/places/" + placeId + "/notices"), account, noticeJson("Só um aviso geral", false, null))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.notice.placeId").value(placeId))
                .andExpect(jsonPath("$.notice.commentCount").value(0))
                .andExpect(jsonPath("$.initialComment.initial").value(true))
                .andExpect(jsonPath("$.initialComment.review").doesNotExist());

        call(get("/places/" + placeId), null)
                .andExpect(jsonPath("$.stats.ratingCount").value(0));
        call(get("/me"), account)
                .andExpect(jsonPath("$.validContributions").value(1));
    }

    @Test
    void createNoticeValidation() throws Exception {
        Account account = register();
        String placeId = createPlace(account, "Validação " + unique("p"), nextOrigin());

        call(post("/places/" + placeId + "/notices"), null, noticeJson("Sem login aqui", false, null))
                .andExpect(status().isUnauthorized());

        call(post("/places/" + placeId + "/notices"), account, "{\"title\":\"Oi\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.title").exists())
                .andExpect(jsonPath("$.fields.type").exists())
                .andExpect(jsonPath("$.fields.body").exists());

        call(post("/places/" + placeId + "/notices"), account,
                noticeJson("Nota fora da escala", false, reviewJson(6, 0, 3, 3, 9)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields['review.safety']").exists())
                .andExpect(jsonPath("$.fields['review.lighting']").exists())
                .andExpect(jsonPath("$.fields['review.restroom']").exists());

        call(post("/places/" + placeId + "/notices"), account,
                noticeJson("Avaliação incompleta", false, "{\"safety\":3}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields['review.lighting']").exists());

        call(post("/places/" + UUID.randomUUID() + "/notices"), account, noticeJson("Local inexistente", false, null))
                .andExpect(status().isNotFound());
    }

    @Test
    void anonymousNoticeHidesAuthorExceptForHerself() throws Exception {
        Account author = register();
        Account other = register();
        String placeId = createPlace(author, "Anônimo " + unique("p"), nextOrigin());

        String json = body(call(post("/places/" + placeId + "/notices"), author,
                noticeJson("Relato anônimo", true, null)).andExpect(status().isCreated()));
        String noticeId = com.jayway.jsonpath.JsonPath.read(json, "$.notice.id");

        call(get("/notices/" + noticeId), other)
                .andExpect(jsonPath("$.notice.author.name").value("Anônima"))
                .andExpect(jsonPath("$.notice.author.id").doesNotExist())
                .andExpect(jsonPath("$.notice.author.username").doesNotExist())
                .andExpect(jsonPath("$.notice.author.mine").value(false))
                .andExpect(jsonPath("$.initialComment.author.name").value("Anônima"));

        call(get("/notices/" + noticeId), author)
                .andExpect(jsonPath("$.notice.author.mine").value(true));

        String publicJson = body(call(post("/places/" + placeId + "/notices"), author,
                noticeJson("Relato identificado", false, null)).andExpect(status().isCreated()));
        String publicId = com.jayway.jsonpath.JsonPath.read(publicJson, "$.notice.id");

        call(get("/notices/" + publicId), other)
                .andExpect(jsonPath("$.notice.author.username").value(author.username()));
    }

    @Test
    void noticesAreListedByMostRecentActivity() throws Exception {
        Account account = register();
        String placeId = createPlace(account, "Ordem " + unique("p"), nextOrigin());
        String older = createNotice(account, placeId, null)[0];
        String newer = createNotice(account, placeId, null)[0];

        call(get("/places/" + placeId + "/notices"), null)
                .andExpect(jsonPath("$.content[0].id").value(newer))
                .andExpect(jsonPath("$.content[1].id").value(older));

        createComment(account, older, null);

        call(get("/places/" + placeId + "/notices"), null)
                .andExpect(jsonPath("$.content[0].id").value(older))
                .andExpect(jsonPath("$.content[0].commentCount").value(1));

        call(get("/places/" + UUID.randomUUID() + "/notices"), null)
                .andExpect(status().isNotFound());
    }

    @Test
    void onlyAuthorEditsNotice() throws Exception {
        Account author = register();
        Account other = register();
        Account moderator = register(Role.MODERATOR);
        String placeId = createPlace(author, "Edição " + unique("p"), nextOrigin());
        String noticeId = createNotice(author, placeId, null)[0];
        String update = "{\"title\":\"Título corrigido\",\"type\":\"HARASSMENT\"}";

        call(put("/notices/" + noticeId), author, update)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notice.title").value("Título corrigido"))
                .andExpect(jsonPath("$.notice.type").value("HARASSMENT"));

        call(put("/notices/" + noticeId), other, update).andExpect(status().isForbidden());
        call(put("/notices/" + noticeId), moderator, update).andExpect(status().isForbidden());
        call(put("/notices/" + noticeId), author, "{\"title\":\"Oi\"}").andExpect(status().isBadRequest());
    }

    @Test
    void deletingNoticeHidesItAndItsRating() throws Exception {
        Account author = register();
        Account other = register();
        String placeId = createPlace(author, "Remoção " + unique("p"), nextOrigin());
        String noticeId = createNotice(author, placeId, reviewJson(2, 2, 2, 2, null))[0];

        call(get("/places/" + placeId), null).andExpect(jsonPath("$.stats.ratingCount").value(1));

        call(delete("/notices/" + noticeId), other).andExpect(status().isForbidden());
        call(delete("/notices/" + noticeId), author).andExpect(status().isNoContent());

        call(get("/notices/" + noticeId), null).andExpect(status().isNotFound());
        call(get("/notices/" + noticeId + "/comments"), null).andExpect(status().isNotFound());
        call(post("/notices/" + noticeId + "/comments"), other, commentJson("Tarde demais", null))
                .andExpect(status().isNotFound());
        call(get("/places/" + placeId + "/notices"), null).andExpect(jsonPath("$.totalElements").value(0));
        call(get("/places/" + placeId), null)
                .andExpect(jsonPath("$.stats.ratingCount").value(0))
                .andExpect(jsonPath("$.stats.rating").doesNotExist());
    }

    @Test
    void moderatorCanDeleteAnyNotice() throws Exception {
        Account author = register();
        Account moderator = register(Role.MODERATOR);
        String placeId = createPlace(author, "Moderação " + unique("p"), nextOrigin());
        String noticeId = createNotice(author, placeId, null)[0];

        call(delete("/notices/" + noticeId), moderator).andExpect(status().isNoContent());
        call(delete("/notices/" + noticeId), moderator).andExpect(status().isNotFound());
    }

    // ---------- comentários ----------

    @Test
    void commentsAreListedOldestFirstWithoutInitialComment() throws Exception {
        Account author = register();
        Account other = register();
        String placeId = createPlace(author, "Comentários " + unique("p"), nextOrigin());
        String noticeId = createNotice(author, placeId, null)[0];
        String first = createComment(other, noticeId, null);
        String second = createComment(author, noticeId, reviewJson(4, 4, 4, 4, null));

        call(get("/notices/" + noticeId + "/comments"), null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].id").value(first))
                .andExpect(jsonPath("$.content[1].id").value(second))
                .andExpect(jsonPath("$.content[1].review.score").value(4.0))
                .andExpect(jsonPath("$.content[0].review").doesNotExist());

        call(get("/notices/" + noticeId + "/comments").param("size", "1"), null)
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @Test
    void commentValidation() throws Exception {
        Account account = register();
        String placeId = createPlace(account, "Validação C " + unique("p"), nextOrigin());
        String noticeId = createNotice(account, placeId, null)[0];

        call(post("/notices/" + noticeId + "/comments"), null, commentJson("Sem login", null))
                .andExpect(status().isUnauthorized());
        call(post("/notices/" + noticeId + "/comments"), account, "{\"body\":\"\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.body").exists());
        call(post("/notices/" + noticeId + "/comments"), account, "{\"body\":\"" + "x".repeat(1001) + "\"}")
                .andExpect(status().isBadRequest());
        call(post("/notices/" + UUID.randomUUID() + "/comments"), account, commentJson("Aviso inexistente", null))
                .andExpect(status().isNotFound());
    }

    @Test
    void editAndDeleteComment() throws Exception {
        Account author = register();
        Account other = register();
        Account moderator = register(Role.MODERATOR);
        String placeId = createPlace(author, "Edição C " + unique("p"), nextOrigin());
        String noticeId = createNotice(author, placeId, null)[0];
        String commentId = createComment(author, noticeId, null);
        String otherComment = createComment(other, noticeId, null);

        call(put("/comments/" + commentId), author, "{\"body\":\"Texto corrigido\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.body").value("Texto corrigido"))
                .andExpect(jsonPath("$.editedAt").isNotEmpty());

        call(put("/comments/" + commentId), other, "{\"body\":\"Invasão\"}").andExpect(status().isForbidden());
        call(delete("/comments/" + commentId), other).andExpect(status().isForbidden());

        call(delete("/comments/" + commentId), author).andExpect(status().isNoContent());
        call(delete("/comments/" + commentId), author).andExpect(status().isNotFound());
        call(put("/comments/" + commentId), author, "{\"body\":\"Fantasma\"}").andExpect(status().isNotFound());

        call(delete("/comments/" + otherComment), moderator).andExpect(status().isNoContent());

        call(get("/notices/" + noticeId), null).andExpect(jsonPath("$.notice.commentCount").value(0));
        call(get("/notices/" + noticeId + "/comments"), null).andExpect(jsonPath("$.totalElements").value(0));
    }

    // ---------- nota ponderada ----------

    @Test
    void onlyLatestReviewOfEachUserCounts() throws Exception {
        Account account = register();
        String placeId = createPlace(account, "Última nota " + unique("p"), nextOrigin());
        String noticeId = createNotice(account, placeId, reviewJson(1, 1, 1, 1, 1))[0];
        String latest = createComment(account, noticeId, reviewJson(5, 5, 5, 5, null));

        call(get("/places/" + placeId), null)
                .andExpect(jsonPath("$.stats.ratingCount").value(1))
                .andExpect(jsonPath("$.stats.rating").value(5.0))
                .andExpect(jsonPath("$.stats.restroom").doesNotExist());

        // removendo a avaliação mais recente, volta a valer a anterior
        call(delete("/comments/" + latest), account).andExpect(status().isNoContent());

        call(get("/places/" + placeId), null)
                .andExpect(jsonPath("$.stats.rating").value(1.0))
                .andExpect(jsonPath("$.stats.restroom").value(1.0));
    }
}
