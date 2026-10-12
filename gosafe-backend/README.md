# GoSafe — backend

API REST em Java 21 + Spring Boot 4, PostgreSQL + PostGIS, migrações com Flyway e autenticação JWT.

## Como rodar

Pré-requisitos: Java 21 e Docker em execução.

```bash
./mvnw spring-boot:run
```

O `compose.yaml` sobe um `postgis/postgis:16-3.4` automaticamente (suporte a Docker Compose do Spring Boot) e o Flyway cria o schema (`src/main/resources/db/migration`).

Variáveis úteis:

| Variável | Para quê |
|---|---|
| `GOSAFE_JWT_SECRET` | Segredo do JWT (mínimo 32 bytes). Obrigatório fora do ambiente de desenvolvimento. |
| `GOSAFE_ADMIN_EMAILS` | E-mails (separados por vírgula) que recebem papel `ADMIN` ao se cadastrar. |

Testes (H2 em memória, sem Docker):

```bash
./mvnw test
```

As consultas espaciais (mapa, busca por distância, check-in, duplicidade) usam PostGIS e só rodam no Postgres.

## Estrutura

Um pacote por funcionalidade (`controller → service → repository`):

| Pacote | Responsabilidade |
|---|---|
| `auth`, `security` | Cadastro, login e JWT. A autora de qualquer conteúdo vem do token (`@AuthenticationPrincipal`), nunca do corpo da requisição. |
| `user` | Perfil (`/me`) e listagem para admin. |
| `verification` | Verificação facial **opcional** e **simulada** (`SimulatedVerificationProvider`); guarda só resultado e data, nunca imagem. |
| `geo` | ViaCEP (CEP → endereço) e Nominatim/OpenStreetMap (endereço → coordenadas), com cache e limite de 1 req/s. |
| `place` | Locais com endereço estruturado, mapa por área visível, busca, fotos. |
| `checkin` | Check-in a até 100 m (descontada a precisão do GPS), 1 por local a cada 4 h; guarda só a distância. |
| `notice`, `comment` | Avisos (fórum) com comentário inicial e comentários; anonimato opcional. |
| `review` | Avaliação com 5 parâmetros (banheiro pode ser "não há") e nota ponderada do local. |
| `reputation` | Peso do perfil (0,1–1,0) e do voto — ver `ReputationFormula`. |
| `favorite` | Favoritos. |
| `report` | Denúncias e moderação; denúncia procedente oculta o conteúdo e reduz a reputação. |

## Endpoints

Públicos: `POST /auth/*` e `GET` em `/places/**` e `/notices/**`. O resto exige `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` | Cadastro (nome, username, e-mail, senha, sexo) → token |
| POST | `/auth/login` | Login por e-mail ou username → token |
| GET / PUT / DELETE | `/me` | Ver, editar e desativar o próprio perfil |
| PUT | `/me/password` | Trocar senha |
| POST / GET | `/me/verification` | Verificação facial simulada (exige `consent: true`) |
| GET | `/me/checkins` | Meus check-ins |
| GET | `/me/favorites` | Meus favoritos |
| GET | `/geo/postal-code/{cep}` | Endereço a partir do CEP |
| GET | `/geo/geocode` | Coordenadas a partir do endereço |
| GET | `/places/map?minLng&minLat&maxLng&maxLat&category` | Pins da área visível do mapa |
| GET | `/places?q&category&district&city&lat&lng&sort&page&size` | Lista de locais (`sort`: `DISTANCE`, `RATING`, `NAME`) |
| GET | `/places/{id}` | Detalhe com nota ponderada por parâmetro |
| POST / PUT | `/places`, `/places/{id}` | Cadastrar/editar local (sem lat/lng o endereço é geocodificado) |
| DELETE | `/places/{id}` | Remover local (moderação) |
| GET / POST | `/places/{id}/photos` | Fotos (por URL) |
| PUT / DELETE | `/places/{id}/favorite` | Favoritar / desfavoritar |
| POST | `/places/{id}/checkins` | Check-in (latitude, longitude, precisão do GPS) |
| GET / POST | `/places/{id}/notices` | Avisos do local (recentes primeiro) / novo aviso com comentário inicial e avaliação |
| GET / PUT / DELETE | `/notices/{id}` | Aviso |
| GET / POST | `/notices/{id}/comments` | Comentários / novo comentário com avaliação |
| PUT / DELETE | `/comments/{id}` | Editar / remover comentário |
| POST | `/reports` | Denunciar aviso, comentário ou local |
| GET / PATCH | `/admin/reports`, `/admin/reports/{id}` | Fila de moderação e decisão |
| GET | `/admin/users` | Usuárias (só admin) |

Erros seguem o formato `{status, error, message, fields, timestamp}`.
