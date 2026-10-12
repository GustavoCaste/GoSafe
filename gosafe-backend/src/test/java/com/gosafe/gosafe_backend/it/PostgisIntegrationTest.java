package com.gosafe.gosafe_backend.it;

import com.gosafe.gosafe_backend.geo.GeocodingService;
import com.gosafe.gosafe_backend.user.Role;
import com.gosafe.gosafe_backend.user.User;
import com.gosafe.gosafe_backend.user.UserRepository;
import com.jayway.jsonpath.JsonPath;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Base dos testes de API contra um PostgreSQL + PostGIS real (Testcontainers).
 * O Flyway aplica as migrações e o Hibernate valida o schema contra as
 * entidades. A geocodificação externa (ViaCEP/Nominatim) é simulada com mock.
 * Os testes são ignorados quando não há Docker disponível.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@TestPropertySource(properties = {
        "spring.datasource.driver-class-name=org.postgresql.Driver",
        "spring.flyway.enabled=true",
        "spring.jpa.hibernate.ddl-auto=validate"
})
public abstract class PostgisIntegrationTest {

    @ServiceConnection
    static final PostgreSQLContainer POSTGIS = new PostgreSQLContainer(
            DockerImageName.parse("postgis/postgis:16-3.4").asCompatibleSubstituteFor("postgres")
    );

    static {
        POSTGIS.start();
    }

    private static final AtomicInteger COUNTER = new AtomicInteger();

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected UserRepository userRepository;

    @MockitoBean
    protected GeocodingService geocodingService;

    protected record Account(String token, String id, String email, String username) {
    }

    protected record Point(double lat, double lng) {

        /** Ponto deslocado ~{@code meters} metros para o norte. */
        public Point north(double meters) {
            return new Point(lat + meters / 111_195.0, lng);
        }
    }

    protected static String unique(String prefix) {
        return prefix + COUNTER.incrementAndGet();
    }

    /** Cada teste usa uma origem própria, a ~5 km das outras, para não interferir nos demais. */
    protected static Point nextOrigin() {
        return new Point(-23.40 - COUNTER.incrementAndGet() * 0.05, -46.60);
    }

    protected Account register() throws Exception {
        String username = unique("user");
        String email = username + "@gosafe.test";

        String json = body(call(post("/auth/register"), null,
                registerJson("Usuária " + username, username, email, "senha-forte-1"))
                .andExpect(status().isCreated()));

        return new Account(JsonPath.read(json, "$.token"), JsonPath.read(json, "$.user.id"), email, username);
    }

    protected Account register(Role role) throws Exception {
        Account account = register();
        User user = userRepository.findById(UUID.fromString(account.id())).orElseThrow();
        user.setRole(role);
        userRepository.save(user);
        return account;
    }

    protected static String registerJson(String name, String username, String email, String password) {
        return """
                {"name":"%s","username":"%s","email":"%s","password":"%s","sex":"FEMALE"}
                """.formatted(name, username, email, password);
    }

    protected ResultActions call(MockHttpServletRequestBuilder request, Account who) throws Exception {
        if (who != null) {
            request.header("Authorization", "Bearer " + who.token());
        }
        return mvc.perform(request.characterEncoding(StandardCharsets.UTF_8));
    }

    protected ResultActions call(MockHttpServletRequestBuilder request, Account who, String json) throws Exception {
        return call(request.contentType(MediaType.APPLICATION_JSON).content(json), who);
    }

    protected static String body(ResultActions result) throws Exception {
        return result.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
    }

    protected static String placeJson(String name, Point point) {
        return placeJson(name, "CAFE", "Bela Vista", point);
    }

    protected static String placeJson(String name, String category, String district, Point point) {
        String coordinates = point == null
                ? ""
                : ",\"latitude\":" + point.lat() + ",\"longitude\":" + point.lng();

        return """
                {"name":"%s","category":"%s","description":"Local de teste",
                 "postalCode":"01310100","street":"Av. Paulista","number":"1000",
                 "district":"%s","city":"São Paulo","state":"sp"%s}
                """.formatted(name, category, district, coordinates);
    }

    protected String createPlace(Account who, String name, Point point) throws Exception {
        return createPlace(who, name, "CAFE", "Bela Vista", point);
    }

    protected String createPlace(Account who, String name, String category, String district, Point point)
            throws Exception {
        String json = body(call(post("/places"), who, placeJson(name, category, district, point))
                .andExpect(status().isCreated()));
        return JsonPath.read(json, "$.id");
    }

    protected static String reviewJson(int safety, int lighting, int movement, int welcoming, Integer restroom) {
        return """
                {"safety":%d,"lighting":%d,"movement":%d,"welcoming":%d,"restroom":%s}
                """.formatted(safety, lighting, movement, welcoming, restroom == null ? "null" : restroom);
    }

    protected static String noticeJson(String title, boolean anonymous, String review) {
        return """
                {"title":"%s","type":"LIGHTING","body":"Relato de teste","anonymous":%s,"review":%s}
                """.formatted(title, anonymous, review == null ? "null" : review);
    }

    protected static String commentJson(String text, String review) {
        return """
                {"body":"%s","review":%s}
                """.formatted(text, review == null ? "null" : review);
    }

    /** Cria um aviso e devolve {noticeId, initialCommentId}. */
    protected String[] createNotice(Account who, String placeId, String review) throws Exception {
        String json = body(call(post("/places/" + placeId + "/notices"), who,
                noticeJson("Aviso " + unique("n"), false, review))
                .andExpect(status().isCreated()));
        return new String[]{JsonPath.read(json, "$.notice.id"), JsonPath.read(json, "$.initialComment.id")};
    }

    protected String createComment(Account who, String noticeId, String review) throws Exception {
        String json = body(call(post("/notices/" + noticeId + "/comments"), who,
                commentJson("Comentário " + unique("c"), review))
                .andExpect(status().isCreated()));
        return JsonPath.read(json, "$.id");
    }
}
