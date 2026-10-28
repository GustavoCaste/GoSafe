package com.gosafe.gosafe_backend;

import com.gosafe.gosafe_backend.place.GeocodeSource;
import com.gosafe.gosafe_backend.place.Place;
import com.gosafe.gosafe_backend.place.PlaceCategory;
import com.gosafe.gosafe_backend.place.PlaceRepository;
import com.gosafe.gosafe_backend.user.UserRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Fluxo completo da API em H2. As consultas PostGIS (mapa, busca por
 * distância, check-in e duplicidade) só rodam no Postgres real, por isso o
 * local é criado direto no repositório.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ApiFlowIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private PlaceRepository placeRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void fullFlow() throws Exception {
        String maria = register("Maria Silva", "maria.flow", "maria.flow@gosafe.test");

        mvc.perform(withToken(get("/me"), maria))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("maria.flow"))
                .andExpect(jsonPath("$.verified").value(false))
                .andExpect(jsonPath("$.reputationWeight").value(0.2));

        mvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON).content(registerJson(
                        "Outra", "outra.flow", "maria.flow@gosafe.test", "senha-forte-1")))
                .andExpect(status().isConflict());

        mvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON).content(registerJson(
                        "Curta", "curta.flow", "curta.flow@gosafe.test", "123")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.password").exists());

        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"login\":\"maria.flow\",\"password\":\"senha-forte-1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());

        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"login\":\"maria.flow\",\"password\":\"errada-123\"}"))
                .andExpect(status().isUnauthorized());

        String placeId = createPlace("maria.flow@gosafe.test").toString();

        mvc.perform(get("/places/" + placeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stats.ratingCount").value(0))
                .andExpect(jsonPath("$.favorite").value(false));

        mvc.perform(post("/places/" + placeId + "/notices").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Saída escura\",\"type\":\"LIGHTING\",\"body\":\"x\"}"))
                .andExpect(status().isUnauthorized());

        String noticeJson = mvc.perform(withToken(post("/places/" + placeId + "/notices"), maria)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Iluminação fraca na saída lateral","type":"LIGHTING",
                                 "body":"Fica bem escura depois das 20h.","anonymous":true,
                                 "review":{"safety":4,"lighting":2,"movement":3,"welcoming":5}}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.notice.author.name").value("Anônima"))
                .andExpect(jsonPath("$.notice.author.id").value(nullValue()))
                .andExpect(jsonPath("$.notice.author.mine").value(true))
                .andExpect(jsonPath("$.initialComment.review.score").value(3.5))
                .andExpect(jsonPath("$.initialComment.review.restroom").value(nullValue()))
                .andReturn().getResponse().getContentAsString();
        String noticeId = JsonPath.read(noticeJson, "$.notice.id");

        mvc.perform(get("/places/" + placeId))
                .andExpect(jsonPath("$.stats.rating").value(3.5))
                .andExpect(jsonPath("$.stats.ratingCount").value(1))
                .andExpect(jsonPath("$.stats.restroom").value(nullValue()));

        mvc.perform(get("/places/" + placeId + "/notices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].author.mine").value(false));

        String ana = register("Ana Souza", "ana.flow", "ana.flow@gosafe.test");

        String commentJson = mvc.perform(withToken(post("/notices/" + noticeId + "/comments"), ana)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"body":"Aqui sempre me senti segura.",
                                 "review":{"safety":5,"lighting":5,"movement":5,"welcoming":5,"restroom":5}}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.author.username").value("ana.flow"))
                .andExpect(jsonPath("$.review.withCheckIn").value(false))
                .andReturn().getResponse().getContentAsString();
        String commentId = JsonPath.read(commentJson, "$.id");

        mvc.perform(get("/notices/" + noticeId))
                .andExpect(jsonPath("$.notice.commentCount").value(1));

        // Pesos iguais (0,2 cada): média ponderada = (3,5 + 5) / 2
        mvc.perform(get("/places/" + placeId))
                .andExpect(jsonPath("$.stats.rating").value(4.25))
                .andExpect(jsonPath("$.stats.ratingCount").value(2))
                .andExpect(jsonPath("$.stats.restroom").value(5.0));

        mvc.perform(withToken(put("/comments/" + commentId), maria)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"body\":\"edição indevida\"}"))
                .andExpect(status().isForbidden());

        mvc.perform(withToken(post("/me/verification"), ana)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"consent\":false}"))
                .andExpect(status().isBadRequest());

        mvc.perform(withToken(post("/me/verification"), ana)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"consent\":true}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.provider").value("SIMULATED"));

        mvc.perform(withToken(get("/me"), ana))
                .andExpect(jsonPath("$.verified").value(true))
                // 0,2 base + 0,2 verificada + 0,015 (1 contribuição)
                .andExpect(jsonPath("$.reputationWeight").value(0.415));

        String reportBody = "{\"targetType\":\"COMMENT\",\"targetId\":\"" + commentId + "\",\"reason\":\"Informação falsa\"}";

        mvc.perform(withToken(post("/reports"), maria).contentType(MediaType.APPLICATION_JSON).content(reportBody))
                .andExpect(status().isCreated());

        mvc.perform(withToken(post("/reports"), maria).contentType(MediaType.APPLICATION_JSON).content(reportBody))
                .andExpect(status().isConflict());

        mvc.perform(withToken(get("/admin/reports"), maria))
                .andExpect(status().isForbidden());

        String admin = register("Admin", "admin.flow", "admin@gosafe.test");

        String reportsJson = mvc.perform(withToken(get("/admin/reports"), admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andReturn().getResponse().getContentAsString();
        String reportId = JsonPath.read(reportsJson, "$.content[0].id");

        mvc.perform(withToken(patch("/admin/reports/" + reportId), admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"upheld\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UPHELD"));

        mvc.perform(get("/notices/" + noticeId + "/comments"))
                .andExpect(jsonPath("$.totalElements").value(0));

        mvc.perform(get("/places/" + placeId))
                .andExpect(jsonPath("$.stats.rating").value(3.5))
                .andExpect(jsonPath("$.stats.ratingCount").value(1));

        mvc.perform(withToken(put("/places/" + placeId + "/favorite"), maria))
                .andExpect(status().isNoContent());

        mvc.perform(withToken(get("/me/favorites"), maria))
                .andExpect(jsonPath("$.length()").value(1));

        mvc.perform(withToken(get("/places/" + placeId), maria))
                .andExpect(jsonPath("$.favorite").value(true))
                .andExpect(jsonPath("$.canEdit").value(true));

        mvc.perform(get("/places").param("q", "aurora"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Café Aurora"));

        mvc.perform(withToken(delete("/notices/" + noticeId), maria))
                .andExpect(status().isNoContent());

        mvc.perform(get("/places/" + placeId))
                .andExpect(jsonPath("$.stats.ratingCount").value(0))
                .andExpect(jsonPath("$.stats.rating").value(nullValue()));
    }

    private java.util.UUID createPlace(String creatorEmail) {
        Place place = new Place();

        place.setName("Café Aurora");
        place.setCategory(PlaceCategory.CAFE);
        place.setDescription("Ambiente tranquilo");
        place.setPostalCode("01310-100");
        place.setStreet("Av. Central");
        place.setNumber("120");
        place.setDistrict("Centro");
        place.setCity("São Paulo");
        place.setState("SP");
        place.setLatitude(-23.5614);
        place.setLongitude(-46.6559);
        place.setGeocodeSource(GeocodeSource.MANUAL);
        place.setCreatedBy(userRepository.findByEmailIgnoreCase(creatorEmail).orElseThrow());

        return placeRepository.save(place).getId();
    }

    private String register(String name, String username, String email) throws Exception {
        String json = mvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson(name, username, email, "senha-forte-1")))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return JsonPath.read(json, "$.token");
    }

    private static String registerJson(String name, String username, String email, String password) {
        return """
                {"name":"%s","username":"%s","email":"%s","password":"%s","sex":"FEMALE"}
                """.formatted(name, username, email, password);
    }

    private static MockHttpServletRequestBuilder withToken(MockHttpServletRequestBuilder request, String token) {
        return request.header("Authorization", "Bearer " + token);
    }
}
