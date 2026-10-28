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

import java.util.List;
import java.util.UUID;

/**
 * Carga mínima para desenvolvimento (perfil {@code dev}): 2 usuárias e 5 locais,
 * cada local com um aviso e um comentário avaliando. Passa pelas próprias
 * regras de negócio, então pesos e nota ponderada são calculados de verdade.
 *
 * <ul>
 *   <li>{@code dev@gosafe.dev} — conta de desenvolvimento (verificada)</li>
 *   <li>{@code usuaria@gosafe.dev} — usuária comum</li>
 * </ul>
 * Senha das duas: {@code gosafe123}. Dados fictícios, criados por IA.
 */
@Component
@Profile("dev")
public class DevDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);
    static final String PASSWORD = "gosafe123";
    static final String DEV_EMAIL = "dev@gosafe.dev";

    private record Seed(
            String name, PlaceCategory category, String street, String number, String district,
            String postalCode, double lat, double lng, NoticeType type, String title,
            String report, String reply, int rating
    ) {
    }

    private static final List<Seed> PLACES = List.of(
            new Seed("Café Aurora", PlaceCategory.CAFE, "Av. Paulista", "1000", "Bela Vista", "01310-100",
                    -23.5646, -46.6527, NoticeType.WELCOMING, "Lugar muito seguro e acolhedor",
                    "Ambiente tranquilo, me senti segura o tempo todo.", "Equipe atenciosa e local bem iluminado.", 5),
            new Seed("Padaria Central", PlaceCategory.CAFE, "Rua Galvão Bueno", "100", "Liberdade", "01506-000",
                    -23.5580, -46.6350, NoticeType.GENERAL, "Como foi minha experiência aqui",
                    "De dia é tranquilo, à noite fica mais vazio.", "Nada de grave, mas fico atenta.", 4),
            new Seed("Terminal Vila Nova", PlaceCategory.TRANSPORT, "Rua Vergueiro", "3500", "Vila Mariana", "04101-000",
                    -23.5760, -46.6410, NoticeType.MOVEMENT, "Movimento cai depois das 22h",
                    "Atendimento ok, mas a entrada é pouco iluminada.", "Depende do horário; aos fins de semana é melhor.", 3),
            new Seed("Parque das Árvores", PlaceCategory.PARK, "Av. Vital Brasil", "700", "Butantã", "05503-000",
                    -23.5700, -46.7080, NoticeType.LIGHTING, "Trilha sem iluminação à noite",
                    "Muito escuro e sem ninguém por perto.", "Evitem à noite, local muito inseguro.", 2),
            new Seed("Bar do Porto", PlaceCategory.BAR, "Rua José Paulino", "300", "Bom Retiro", "01120-000",
                    -23.5280, -46.6400, NoticeType.HARASSMENT, "Cuidado: local inseguro",
                    "Presenciei assédio e ninguém ajudou.", "Fui seguida na saída, não volto sozinha.", 1)
    );

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
        if (userRepository.existsByEmailIgnoreCase(DEV_EMAIL)) {
            log.info("Carga de dev já existe; nada a fazer.");
            return;
        }

        AuthUser dev = register("Conta de Desenvolvimento", "dev", DEV_EMAIL);
        verificationService.verify(dev.id());
        AuthUser user = register("Usuária Exemplo", "usuaria", "usuaria@gosafe.dev");

        for (Seed seed : PLACES) {
            seedPlace(seed, dev, user);
        }

        log.info("Carga de dev concluída: 2 usuárias e {} locais.", PLACES.size());
    }

    private AuthUser register(String name, String username, String email) {
        var token = authService.register(new RegisterRequest(name, username, email, PASSWORD, Sex.FEMALE));
        return new AuthUser(token.user().id(), token.user().email(), token.user().role());
    }

    private void seedPlace(Seed seed, AuthUser dev, AuthUser user) {
        UUID placeId = placeService.create(new PlaceRequest(
                seed.name(), seed.category(), "Local de demonstração do GoSafe.",
                seed.postalCode(), seed.street(), seed.number(), null,
                seed.district(), "São Paulo", "SP", seed.lat(), seed.lng()
        ), dev).id();

        int r = seed.rating();
        UUID noticeId = noticeService.create(placeId, new CreateNoticeRequest(
                seed.title(), seed.type(), seed.report(), false, new ReviewRequest(r, r, r, r, r)
        ), dev).notice().id();

        commentService.create(noticeId, new CreateCommentRequest(
                seed.reply(), true, new ReviewRequest(r, r, r, r, null)
        ), user);
    }
}
