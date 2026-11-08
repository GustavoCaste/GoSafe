package com.gosafe.gosafe_backend.it;

import com.gosafe.gosafe_backend.user.Role;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ReportApiTest extends PostgisIntegrationTest {

    private static String reportJson(String type, String targetId) {
        return "{\"targetType\":\"" + type + "\",\"targetId\":\"" + targetId + "\",\"reason\":\"Conteúdo falso\"}";
    }

    private String report(Account reporter, String type, String targetId) throws Exception {
        String json = body(call(post("/reports"), reporter, reportJson(type, targetId))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.origin").value("USER")));
        return JsonPath.read(json, "$.id");
    }

    @Test
    void reportValidation() throws Exception {
        Account author = register();
        Account reporter = register();
        String placeId = createPlace(author, "Denúncia " + unique("p"), nextOrigin());
        String noticeId = createNotice(author, placeId, null)[0];

        call(post("/reports"), null, reportJson("NOTICE", noticeId)).andExpect(status().isUnauthorized());

        call(post("/reports"), reporter, "{}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.targetType").exists())
                .andExpect(jsonPath("$.fields.targetId").exists())
                .andExpect(jsonPath("$.fields.reason").exists());

        call(post("/reports"), author, reportJson("NOTICE", noticeId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Não é possível denunciar o próprio conteúdo"));

        call(post("/reports"), reporter, reportJson("COMMENT", UUID.randomUUID().toString()))
                .andExpect(status().isNotFound());

        report(reporter, "NOTICE", noticeId);
        call(post("/reports"), reporter, reportJson("NOTICE", noticeId)).andExpect(status().isConflict());
    }

    @Test
    void realAuthorOfAnonymousContentIsVisibleOnlyToModeration() throws Exception {
        Account author = register();
        Account reporter = register();
        Account moderator = register(Role.MODERATOR);
        String placeId = createPlace(author, "Autoria " + unique("p"), nextOrigin());
        String noticeId = JsonPath.read(body(call(post("/places/" + placeId + "/notices"), author,
                "{\"title\":\"Aviso anônimo\",\"type\":\"GENERAL\",\"body\":\"Relato anônimo\",\"anonymous\":true}")
                .andExpect(status().isCreated())), "$.notice.id");

        String reportId = JsonPath.read(body(call(post("/reports"), reporter, reportJson("NOTICE", noticeId))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.targetAuthor").doesNotExist())), "$.id");

        call(get("/notices/" + noticeId), reporter)
                .andExpect(jsonPath("$.notice.author.name").value("Anônima"))
                .andExpect(jsonPath("$.notice.author.id").doesNotExist());

        String queue = body(call(get("/admin/reports").param("size", "50"), moderator).andExpect(status().isOk()));
        List<String> usernames = JsonPath.read(queue,
                "$.content[?(@.id == '" + reportId + "')].targetAuthor.username");
        assertEquals(List.of(author.username()), usernames);
    }

    @Test
    void moderationQueueAccess() throws Exception {
        Account user = register();
        Account moderator = register(Role.MODERATOR);
        Account admin = register(Role.ADMIN);

        call(get("/admin/reports"), null).andExpect(status().isUnauthorized());
        call(get("/admin/reports"), user).andExpect(status().isForbidden());
        call(get("/admin/reports"), moderator).andExpect(status().isOk());
        call(get("/admin/reports").param("status", "UPHELD"), admin).andExpect(status().isOk());
        call(get("/admin/reports").param("status", "QUALQUER"), admin).andExpect(status().isBadRequest());

        call(patch("/admin/reports/" + UUID.randomUUID()), moderator, "{\"upheld\":true}")
                .andExpect(status().isNotFound());
        call(patch("/admin/reports/" + UUID.randomUUID()), moderator, "{}")
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectedReportKeepsContent() throws Exception {
        Account author = register();
        Account reporter = register();
        Account moderator = register(Role.MODERATOR);
        String placeId = createPlace(author, "Rejeitada " + unique("p"), nextOrigin());
        String noticeId = createNotice(author, placeId, null)[0];
        String commentId = createComment(author, noticeId, null);
        String reportId = report(reporter, "COMMENT", commentId);

        call(patch("/admin/reports/" + reportId), moderator, "{\"upheld\":false}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.resolvedAt").isNotEmpty());

        call(get("/notices/" + noticeId + "/comments"), null).andExpect(jsonPath("$.totalElements").value(1));

        call(patch("/admin/reports/" + reportId), moderator, "{\"upheld\":true}")
                .andExpect(status().isConflict());
    }

    @Test
    void upheldCommentReportHidesContentAndLowersReputation() throws Exception {
        Account author = register();
        Account reporter = register();
        Account moderator = register(Role.MODERATOR);
        String placeId = createPlace(reporter, "Procedente " + unique("p"), nextOrigin());
        String noticeId = createNotice(reporter, placeId, reviewJson(4, 4, 4, 4, null))[0];
        String commentId = createComment(author, noticeId, reviewJson(1, 1, 1, 1, null));

        call(get("/places/" + placeId), null).andExpect(jsonPath("$.stats.ratingCount").value(2));
        call(get("/me"), author).andExpect(jsonPath("$.reputationWeight").value(0.215));

        String reportId = report(reporter, "COMMENT", commentId);
        call(patch("/admin/reports/" + reportId), moderator, "{\"upheld\":true}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UPHELD"));

        call(get("/notices/" + noticeId + "/comments"), null).andExpect(jsonPath("$.totalElements").value(0));
        call(get("/notices/" + noticeId), null).andExpect(jsonPath("$.notice.commentCount").value(0));
        call(get("/places/" + placeId), null)
                .andExpect(jsonPath("$.stats.ratingCount").value(1))
                .andExpect(jsonPath("$.stats.rating").value(4.0));

        // 0 contribuições válidas e 1 denúncia procedente → peso mínimo
        call(get("/me"), author)
                .andExpect(jsonPath("$.validContributions").value(0))
                .andExpect(jsonPath("$.reputationWeight").value(0.1));

        call(get("/admin/reports").param("status", "UPHELD"), moderator)
                .andExpect(jsonPath("$.content[?(@.id == '" + reportId + "')]").exists());
    }

    @Test
    void upheldNoticeAndPlaceReportsHideThem() throws Exception {
        Account author = register();
        Account reporter = register();
        Account moderator = register(Role.MODERATOR);
        String placeId = createPlace(author, "Local denunciado " + unique("p"), nextOrigin());
        String noticeId = createNotice(author, placeId, null)[0];

        String noticeReport = report(reporter, "NOTICE", noticeId);
        call(patch("/admin/reports/" + noticeReport), moderator, "{\"upheld\":true}").andExpect(status().isOk());
        call(get("/notices/" + noticeId), null).andExpect(status().isNotFound());
        call(get("/places/" + placeId + "/notices"), null).andExpect(jsonPath("$.totalElements").value(0));

        String placeReport = report(reporter, "PLACE", placeId);
        call(patch("/admin/reports/" + placeReport), moderator, "{\"upheld\":true}").andExpect(status().isOk());
        call(get("/places/" + placeId), null).andExpect(status().isNotFound());
    }
}
