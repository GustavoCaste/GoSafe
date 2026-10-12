package com.gosafe.gosafe_backend.dev;

import com.gosafe.gosafe_backend.auth.AuthService;
import com.gosafe.gosafe_backend.auth.dto.RegisterRequest;
import com.gosafe.gosafe_backend.comment.CommentService;
import com.gosafe.gosafe_backend.comment.dto.CreateCommentRequest;
import com.gosafe.gosafe_backend.notice.NoticeService;
import com.gosafe.gosafe_backend.notice.NoticeType;
import com.gosafe.gosafe_backend.notice.dto.CreateNoticeRequest;
import com.gosafe.gosafe_backend.place.PlaceCategory;
import com.gosafe.gosafe_backend.place.PlaceService;
import com.gosafe.gosafe_backend.place.dto.PlaceRequest;
import com.gosafe.gosafe_backend.review.dto.ReviewRequest;
import com.gosafe.gosafe_backend.security.AuthUser;
import com.gosafe.gosafe_backend.user.Sex;
import com.gosafe.gosafe_backend.user.UserRepository;
import com.gosafe.gosafe_backend.verification.VerificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

/**
 * Carga de dados para desenvolvimento e testes manuais (perfil {@code dev}).
 * Passa pelas próprias regras de negócio, então pesos, nota ponderada e o
 * alerta de local não aconselhado são calculados de verdade.
 *
 * <ul>
 *   <li>50 usuárias (seed01…seed50@gosafe.dev, senha {@code gosafe123}); 10 verificadas</li>
 *   <li>20 locais em São Paulo: 2 quase perfeitos, 5 com nota muito baixa (alerta), 13 variados</li>
 * </ul>
 */
@Component
@Profile("dev")
public class DevDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);
    static final String PASSWORD = "gosafe123";
    static final int USERS = 50;

    private enum Profile { TOP, LOW, MID }

    private record Seed(
            String name, PlaceCategory category, String street, String number, String district,
            String postalCode, double lat, double lng, Profile profile, double target
    ) {
    }

    private static final List<Seed> PLACES = List.of(
            new Seed("Café Aurora", PlaceCategory.CAFE, "Av. Paulista", "1000", "Bela Vista", "01310-100", -23.5646, -46.6527, Profile.TOP, 5),
            new Seed("Academia Movimento", PlaceCategory.GYM, "Rua Augusta", "1500", "Consolação", "01304-001", -23.5560, -46.6600, Profile.TOP, 5),
            new Seed("Terminal Leste", PlaceCategory.TRANSPORT, "Rua do Gasômetro", "200", "Brás", "03004-000", -23.5435, -46.6200, Profile.LOW, 1),
            new Seed("Bar do Porto", PlaceCategory.BAR, "Rua José Paulino", "300", "Bom Retiro", "01120-000", -23.5280, -46.6400, Profile.LOW, 1),
            new Seed("Praça das Flores", PlaceCategory.PARK, "Rua Direita", "50", "Sé", "01002-000", -23.5480, -46.6350, Profile.LOW, 1),
            new Seed("Passarela da Mooca", PlaceCategory.OTHER, "Rua da Mooca", "900", "Mooca", "03104-000", -23.5600, -46.6000, Profile.LOW, 1),
            new Seed("Ponto Final 12", PlaceCategory.TRANSPORT, "Av. do Estado", "3000", "Pari", "03105-000", -23.5300, -46.6250, Profile.LOW, 1),
            new Seed("Padaria Central", PlaceCategory.CAFE, "Rua Galvão Bueno", "100", "Liberdade", "01506-000", -23.5580, -46.6350, Profile.MID, 4.3),
            new Seed("Livraria Página Viva", PlaceCategory.SHOP, "Rua dos Pinheiros", "500", "Pinheiros", "05422-000", -23.5650, -46.6820, Profile.MID, 4.5),
            new Seed("Restaurante Sabor da Casa", PlaceCategory.RESTAURANT, "Rua Domingos de Morais", "800", "Vila Mariana", "04010-000", -23.5890, -46.6370, Profile.MID, 3.9),
            new Seed("Farmácia Bem Estar", PlaceCategory.SERVICE, "Av. Ibirapuera", "2000", "Moema", "04029-000", -23.6000, -46.6640, Profile.MID, 4.1),
            new Seed("Parque das Árvores", PlaceCategory.PARK, "Av. Vital Brasil", "700", "Butantã", "05503-000", -23.5700, -46.7080, Profile.MID, 3.2),
            new Seed("Lanchonete da Esquina", PlaceCategory.RESTAURANT, "Rua das Palmeiras", "400", "Santa Cecília", "01226-000", -23.5370, -46.6560, Profile.MID, 2.8),
            new Seed("Mercado Bom Preço", PlaceCategory.SHOP, "Rua Barra Funda", "600", "Barra Funda", "01152-000", -23.5260, -46.6650, Profile.MID, 3.6),
            new Seed("Cafeteria Livro Aberto", PlaceCategory.CAFE, "Rua Cardoso de Almeida", "900", "Perdizes", "05013-000", -23.5370, -46.6750, Profile.MID, 4.4),
            new Seed("Pub Lua Cheia", PlaceCategory.BAR, "Rua Aspicuelta", "200", "Vila Madalena", "05433-010", -23.5560, -46.6890, Profile.MID, 3.0),
            new Seed("Terminal Vila Nova", PlaceCategory.TRANSPORT, "Rua Vergueiro", "3500", "Vila Mariana", "04101-000", -23.5760, -46.6410, Profile.MID, 3.3),
            new Seed("Coworking Ponto de Encontro", PlaceCategory.SERVICE, "Rua Joaquim Floriano", "300", "Itaim Bibi", "04534-000", -23.5840, -46.6760, Profile.MID, 4.6),
            new Seed("Lavanderia Bolha", PlaceCategory.SERVICE, "Rua Tuiuti", "500", "Tatuapé", "03081-000", -23.5400, -46.5760, Profile.MID, 3.8),
            new Seed("Sorveteria Gelato Sul", PlaceCategory.RESTAURANT, "Av. Jabaquara", "1200", "Saúde", "04046-000", -23.6180, -46.6390, Profile.MID, 2.5)
    );

    private static final String[] NAMES = {
            "Ana", "Beatriz", "Camila", "Daniela", "Eduarda", "Fernanda", "Gabriela", "Helena", "Isabela", "Júlia",
            "Karina", "Larissa", "Mariana", "Natália", "Olívia", "Patrícia", "Quésia", "Rafaela", "Sofia", "Tatiane",
            "Úrsula", "Vanessa", "Yasmin", "Bruna", "Carolina"
    };
    private static final String[] SURNAMES = {"Silva", "Souza", "Oliveira", "Santos", "Lima", "Costa", "Pereira", "Almeida"};

    private static final String[] GOOD = {
            "Ambiente tranquilo, me senti segura o tempo todo.",
            "Equipe atenciosa e local bem iluminado.",
            "Sempre movimentado, ótimo para esperar carona.",
            "Banheiro limpo e de fácil acesso.",
            "Recomendo, inclusive à noite."
    };
    private static final String[] MEDIUM = {
            "De dia é tranquilo, à noite fica mais vazio.",
            "Atendimento ok, mas a entrada é pouco iluminada.",
            "Nada de grave, mas fico atenta.",
            "Depende do horário; aos fins de semana é melhor."
    };
    private static final String[] BAD = {
            "Fui seguida na saída, não volto sozinha.",
            "Muito escuro e sem ninguém por perto.",
            "Presenciei assédio e ninguém ajudou.",
            "Banheiro isolado e sem iluminação.",
            "Evitem à noite, local muito inseguro."
    };

    private final UserRepository userRepository;
    private final AuthService authService;
    private final VerificationService verificationService;
    private final PlaceService placeService;
    private final NoticeService noticeService;
    private final CommentService commentService;

    public DevDataSeeder(
            UserRepository userRepository,
            AuthService authService,
            VerificationService verificationService,
            PlaceService placeService,
            NoticeService noticeService,
            CommentService commentService
    ) {
        this.userRepository = userRepository;
        this.authService = authService;
        this.verificationService = verificationService;
        this.placeService = placeService;
        this.noticeService = noticeService;
        this.commentService = commentService;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmailIgnoreCase(email(1))) {
            log.info("Carga de dev já existe; nada a fazer.");
            return;
        }

        Random random = new Random(42);
        List<AuthUser> users = createUsers();

        for (Seed seed : PLACES) {
            seedPlace(seed, users, random);
        }

        log.info("Carga de dev concluída: {} usuárias e {} locais.", users.size(), PLACES.size());
    }

    private List<AuthUser> createUsers() {
        List<AuthUser> users = new ArrayList<>();

        for (int i = 1; i <= USERS; i++) {
            String name = NAMES[(i - 1) % NAMES.length] + " " + SURNAMES[(i - 1) % SURNAMES.length];
            var token = authService.register(new RegisterRequest(
                    name, String.format("seed%02d", i), email(i), PASSWORD, Sex.FEMALE));
            AuthUser user = new AuthUser(token.user().id(), token.user().email(), token.user().role());

            if (i % 5 == 0) {
                verificationService.verify(user.id());
            }
            users.add(user);
        }

        return users;
    }

    private void seedPlace(Seed seed, List<AuthUser> users, Random random) {
        AuthUser creator = users.get(random.nextInt(users.size()));
        UUID placeId = placeService.create(new PlaceRequest(
                seed.name(), seed.category(), "Local de demonstração do GoSafe.",
                seed.postalCode(), seed.street(), seed.number(), null,
                seed.district(), "São Paulo", "SP", seed.lat(), seed.lng()
        ), creator).id();

        int reviewers = switch (seed.profile()) {
            case TOP -> 12;
            case LOW -> 10;
            case MID -> 3 + random.nextInt(6);
        };

        List<AuthUser> shuffled = new ArrayList<>(users);
        java.util.Collections.shuffle(shuffled, random);
        List<AuthUser> chosen = shuffled.subList(0, reviewers);

        AuthUser first = chosen.get(0);
        UUID noticeId = noticeService.create(placeId, new CreateNoticeRequest(
                titleFor(seed.profile()), typeFor(seed.profile()), textFor(seed.profile(), random),
                random.nextInt(4) == 0, review(seed, random)
        ), first).notice().id();

        for (AuthUser reviewer : chosen.subList(1, chosen.size())) {
            commentService.create(noticeId, new CreateCommentRequest(
                    textFor(seed.profile(), random), random.nextInt(4) == 0, review(seed, random)
            ), reviewer);
        }
    }

    private static ReviewRequest review(Seed seed, Random random) {
        return switch (seed.profile()) {
            case TOP -> new ReviewRequest(5, 5, 5, 5, random.nextInt(6) == 0 ? 4 : 5);
            case LOW -> new ReviewRequest(1, random.nextInt(5) == 0 ? 2 : 1, 1, 1, random.nextBoolean() ? 1 : null);
            case MID -> new ReviewRequest(
                    around(seed.target(), random), around(seed.target(), random),
                    around(seed.target(), random), around(seed.target(), random),
                    random.nextInt(3) == 0 ? null : around(seed.target(), random)
            );
        };
    }

    private static int around(double target, Random random) {
        long value = Math.round(target + random.nextGaussian() * 0.7);
        return (int) Math.max(1, Math.min(5, value));
    }

    private static String titleFor(Profile profile) {
        return switch (profile) {
            case TOP -> "Lugar muito seguro e acolhedor";
            case LOW -> "Cuidado: local inseguro";
            case MID -> "Como foi minha experiência aqui";
        };
    }

    private static NoticeType typeFor(Profile profile) {
        return switch (profile) {
            case TOP -> NoticeType.WELCOMING;
            case LOW -> NoticeType.HARASSMENT;
            case MID -> NoticeType.GENERAL;
        };
    }

    private static String textFor(Profile profile, Random random) {
        String[] pool = switch (profile) {
            case TOP -> GOOD;
            case LOW -> BAD;
            case MID -> random.nextBoolean() ? MEDIUM : GOOD;
        };
        return pool[random.nextInt(pool.length)];
    }

    private static String email(int index) {
        return String.format("seed%02d@gosafe.dev", index);
    }
}
