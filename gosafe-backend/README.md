# GoSafe — backend

API REST em Java 21 + Spring Boot 4, PostgreSQL + PostGIS, migrações com Flyway e autenticação JWT.

## Como rodar

Pré-requisitos: Java 21 e Docker em execução.

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

O `compose.yaml` sobe um `postgis/postgis:16-3.4` automaticamente (suporte a Docker Compose do Spring Boot) e o Flyway cria o schema (`src/main/resources/db/migration`). Na primeira subida, o Flyway também insere a carga inicial de Salvador (`src/main/resources/db/seed`), descrita em [`carga-inicial/README.md`](carga-inicial/README.md). Para subir sem ela, defina `SPRING_FLYWAY_LOCATIONS=classpath:db/migration`.

Variáveis úteis:

| Variável | Para quê |
|---|---|
| `GOSAFE_JWT_SECRET` | Segredo do JWT (mínimo 32 bytes). **Obrigatório** fora do perfil `dev`. |
| `GOSAFE_ADMIN_EMAILS` | E-mails (separados por vírgula) que recebem papel `ADMIN` ao se cadastrar. |

> **Segredo do JWT.** Sem `GOSAFE_JWT_SECRET`, ou com menos de 32 bytes, a aplicação não inicia. O perfil `dev` define um segredo público só para rodar no computador: nunca o ative em um ambiente acessível por outras pessoas.

## Deploy (Render + Neon)

O `Dockerfile` desta pasta gera a imagem da API. No Render, crie um **Web Service** com runtime Docker e Root Directory `gosafe-backend`, e configure:

| Variável | Valor |
|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://HOST-DO-NEON/neondb?sslmode=require` (conexão direta, sem `-pooler`) |
| `SPRING_DATASOURCE_USERNAME` | usuária do Neon |
| `SPRING_DATASOURCE_PASSWORD` | senha do Neon |
| `GOSAFE_JWT_SECRET` | texto aleatório com 32 caracteres ou mais |

Não defina `SPRING_PROFILES_ACTIVE=dev` nesse ambiente. O Flyway cria o schema, a extensão PostGIS e a carga inicial na primeira inicialização. Todos os serviços usam o plano gratuito.

Passo a passo:

1. No Neon, crie o projeto e copie o host, a usuária e a senha da conexão direta.
2. No Render, crie um **Blueprint** a partir deste repositório, na branch publicada: ele lê o `render.yaml` da raiz e pede as três variáveis do Neon. O `GOSAFE_JWT_SECRET` é gerado pelo Render.
3. Quando `https://SUA-API.onrender.com/places?size=1` responder, rode `scripts/contas-iniciais.sql` no SQL Editor do Neon, trocando antes as senhas de exemplo; não salve o arquivo com as senhas reais.
4. Gere o APK apontando para a API e publique a landing:

```powershell
.\mobile\scripts\gerar-apk.ps1 -ApiUrl https://SUA-API.onrender.com
```

```bash
cd landing && npx vercel deploy --prod
```

## Testes

```bash
./mvnw test
```

O código tem **76 métodos de teste implementados**:

- 10 unitários (fórmula de reputação e cálculo de distância);
- 63 de integração da API, que cobrem todos os grupos de endpoints contra um PostgreSQL + PostGIS reais via Testcontainers (a imagem `postgis/postgis:16-3.4`; o Flyway aplica as migrações e o Hibernate valida o schema contra as entidades);
- 3 de contexto, fluxo completo e verificação desligada, que usam H2 em memória.

**Estado da execução:** os 76 testes foram executados e aprovados em 01/11/2026, com Docker em execução.

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
| `verification` | Verificação facial **simulada** (`SimulatedVerificationProvider`), para desenvolvimento e testes. As rotas só existem com `gosafe.verification.simulated-enabled=true`, ligado no perfil `dev` e nos testes; em produção ficam desligadas até haver um provedor real (RF06). |
| `geo` | ViaCEP (CEP → endereço) e Nominatim/OpenStreetMap (endereço → coordenadas), com cache e limite de 1 req/s. |
| `place` | Locais com endereço estruturado, mapa por área visível, busca, fotos e o alerta de local não aconselhado (RN18). |
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
| POST / GET | `/me/verification` | Verificação facial simulada (exige `consent: true`; só no perfil `dev` e nos testes) |
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
