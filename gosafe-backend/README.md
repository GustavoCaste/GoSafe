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
| `GOSAFE_JWT_SECRET` | Segredo do JWT (mínimo 32 bytes). Veja o aviso abaixo. |
| `GOSAFE_ADMIN_EMAILS` | E-mails (separados por vírgula) que recebem papel `ADMIN` ao se cadastrar. |

> **Atenção ao segredo do JWT.** A variável não é obrigatória para a aplicação iniciar: `application.properties` define o valor padrão `dev-only-secret-change-me-please-at-least-32-bytes`, que é público. Sem `GOSAFE_JWT_SECRET`, a aplicação usa esse valor e qualquer pessoa consegue forjar tokens válidos. Defina um segredo próprio, com pelo menos 32 bytes (valores menores impedem a inicialização), em qualquer ambiente acessível por outras pessoas.

### Carga mínima de desenvolvimento (perfil `dev`)

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Cria 2 usuárias — `dev@gosafe.dev` (verificada) e `usuaria@gosafe.dev`, ambas com a senha `gosafe123` — e 5 locais em São Paulo, cada um com um aviso e um comentário avaliando (notas de 1 a 5). A carga passa pelas próprias regras de negócio, então pesos e nota ponderada são calculados de verdade. Sem o perfil `dev`, o banco começa vazio. **Dados fictícios, criados com o auxílio de IA.**

Cuidados:

- As senhas são fixas e públicas. O único controle é o perfil `dev`: não o ative contra um banco real.
- A carga não é transacional. Ela verifica apenas se `dev@gosafe.dev` já existe, então, se for interrompida no meio, as próximas inicializações a consideram concluída. Nesse caso, apague o banco de desenvolvimento e inicie de novo.
- O perfil `dev` não altera a RN18, e o mínimo padrão é 100 avaliadoras. Com 2 por local, nenhum alerta aparece. Para vê-lo, inicie com `-Dspring-boot.run.arguments=--gosafe.alert.min-reviews=2`.

## Testes

```bash
./mvnw test
```

O código tem **73 métodos de teste implementados**:

- 10 unitários (fórmula de reputação e cálculo de distância);
- 61 de integração da API, que cobrem todos os grupos de endpoints contra um PostgreSQL + PostGIS reais via Testcontainers (a imagem `postgis/postgis:16-3.4`; o Flyway aplica as migrações e o Hibernate valida o schema contra as entidades);
- 2 de contexto e fluxo completo, que usam H2 em memória.

**Estado da execução:** até o momento, somente os 10 testes unitários foram executados e aprovados. Os 63 restantes estão implementados, mas ainda não tiveram uma execução registrada, então não há confirmação de que passam.

Os testes de integração precisam de Docker em execução. As consultas espaciais (mapa, busca por distância, check-in e duplicidade) usam PostGIS e só podem ser exercitadas no PostgreSQL. Os testes cobrem sucesso, validação, permissão e regras de negócio.

## Regras de negócio configuráveis

| Propriedade | Padrão | Regra |
|---|---|---|
| `gosafe.alert.min-reviews` | 100 (5 nos testes automatizados) | RN18: mínimo de usuárias avaliando para o alerta |
| `gosafe.alert.max-rating` | 1,5 | RN18: nota ponderada até a qual o local é não aconselhado |
| `gosafe.checkin.radius-meters` | 100 | raio do check-in (descontada a precisão do GPS) |
| `gosafe.checkin.max-accuracy-meters` | 100 | pior precisão de GPS aceita |
| `gosafe.checkin.window-hours` | 4 | intervalo entre check-ins no mesmo local |
| `gosafe.jwt.expiration-hours` | 24 | validade do token |

A RN18 conta **usuárias distintas**: só a avaliação mais recente de cada uma entra na nota e na contagem. A nota e a marcação são recalculadas quando uma avaliação é criada ou removida e quando a moderação oculta um aviso ou um comentário.

## Estrutura

Um pacote por funcionalidade (`controller → service → repository`):

| Pacote | Responsabilidade |
|---|---|
| `auth`, `security` | Cadastro, login e JWT. A autora de qualquer conteúdo vem do token (`@AuthenticationPrincipal`), nunca do corpo da requisição. |
| `user` | Perfil (`/me`) e listagem para admin. |
| `verification` | Verificação facial **opcional** e **simulada** (`SimulatedVerificationProvider`); guarda só resultado e data, nunca imagem. |
| `geo` | ViaCEP (CEP → endereço) e Nominatim/OpenStreetMap (endereço → coordenadas), com cache e limite de 1 req/s. |
| `place` | Locais com endereço estruturado, mapa por área visível, busca, fotos e o alerta de local não aconselhado (RN18). |
| `checkin` | Check-in a até 100 m (descontada a precisão do GPS), 1 por local a cada 4 h; guarda só a distância. |
| `notice`, `comment` | Avisos (fórum) com comentário inicial e comentários; anonimato opcional. |
| `review` | Avaliação com 5 parâmetros (banheiro pode ser "não há") e nota ponderada do local. |
| `reputation` | Peso do perfil (0,1–1,0) e do voto — ver `ReputationFormula`. |
| `favorite` | Favoritos. |
| `report` | Denúncias e moderação; denúncia procedente oculta o conteúdo e reduz a reputação. |
| `dev` | Carga mínima de desenvolvimento (só no perfil `dev`): 2 usuárias e 5 locais. |

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
