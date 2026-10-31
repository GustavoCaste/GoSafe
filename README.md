# GoSafe

**Aplicativo colaborativo de segurança feminina.** Mulheres avaliam locais (cafés, bares, pontos de ônibus, praças…), publicam avisos e consultam, antes de sair de casa, como outras mulheres se sentiram naquele lugar.

> O GoSafe não diz se um local é objetivamente seguro: mostra a **percepção** da comunidade, ponderada pela confiabilidade de quem avaliou.

Projeto de Trabalho de Conclusão de Curso (TCC) — 🚧 em desenvolvimento.

---

## Em 1 minuto

| | Situação |
|---|---|
| **Backend** | ✅ Implementado e testado — 73 testes contra PostgreSQL + PostGIS real |
| **App mobile** | ✅ Conversa com a API; validado em emulador Android |
| **Protótipo de telas** | ✅ 24 quadros: todas as telas, regras, modelo de dados e marca |
| **Publicação** (Neon, Render e Vercel) | ⏳ Próximo passo |

## Como o app funciona

1. **Primeiro acesso:** permissão de localização → login ou cadastro (nome, usuária, e-mail, senha, sexo) → verificação de identidade **opcional**.
2. **Mapa** (tela principal, estilo Waze/Uber): os locais da área visível carregam conforme o mapa se move. O pin mostra a nota e fica vermelho com **!** quando o local é **não aconselhado**.
3. **Locais:** lista estilo iFood (foto, nome, categoria, distância, nota), busca, filtros e favoritos.
4. **Página do local:** nota geral e por parâmetro, check-in e o **fórum de avisos** (mais recentes primeiro). Cada aviso tem comentários, e cada comentário pode trazer uma avaliação.

### Como a nota é calculada

- Cada avaliação tem **5 parâmetros** de 1 a 5: segurança, iluminação, movimento, acolhimento e **banheiro** (que aceita "não há").
- A nota do local é uma **média ponderada pelo peso de quem votou**. O peso (0,1 a 1,0) cresce com tempo de conta, contribuições válidas e verificação, e cai com denúncias procedentes.
- Quem avalia **estando no local** (check-in a até 100 m) ganha bônus de peso.
- Vale só a avaliação mais recente de cada usuária.
- **Local não aconselhado:** a partir de 100 usuárias avaliando e nota ponderada até 1,5, o local recebe alerta no mapa, na lista e na página.

## Começo rápido (backend)

Pré-requisitos: **Java 21** e **Docker** em execução.

```bash
cd gosafe-backend
./mvnw test                                              # 73 testes (sobe PostGIS via Testcontainers)
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev    # API local (banco começa vazio)
```

Fora do computador local, `GOSAFE_JWT_SECRET` é obrigatório.

Detalhes da API, endpoints e configurações: [`gosafe-backend/README.md`](gosafe-backend/README.md).

## App

O código e as instruções de build estão em [`mobile/`](mobile/README.md). A landing page está em [`landing/`](landing/README.md).

## Branches

| Branch | O que tem |
|---|---|
| `main` e `develop` | Bases do projeto |
| `feature/backend-core` | Backend em commits organizados e um início de app |
| **`feature/page`** | **Versão completa:** backend, app conectado à API e landing page |

## O que foi feito

### Backend (Java 21 · Spring Boot 4 · PostgreSQL + PostGIS)

- **Contas e segurança:** cadastro, login por e-mail ou usuária, JWT, papéis (usuária, moderadora, admin). A autora de qualquer conteúdo vem sempre do token, nunca da requisição.
- **Verificação de identidade** opcional e **simulada** (sem custo); nunca guarda imagem (LGPD art. 11).
- **Locais** com endereço estruturado (CEP, logradouro, número, bairro, cidade, UF), CEP pelo ViaCEP e coordenadas pelo OpenStreetMap; bloqueio de duplicado a menos de 50 m.
- **Mapa por área visível**, busca por distância e check-in com consultas geográficas do PostGIS.
- **Avisos, comentários, avaliações, favoritos, fotos, denúncias e moderação**, com anonimato opcional e exclusão lógica.
- **Reputação ponderada** e alerta de **local não aconselhado**.
- **Migrações Flyway** e erros padronizados.
- **73 testes** de todos os endpoints contra banco real; os testes encontraram e corrigiram 2 bugs.

### App mobile

Expo + React Native + TypeScript, com mapa MapLibre/OpenStreetMap. Começou como versão de teste sem servidor e hoje conversa com a API. A versão de teste foi validada num celular Android real com roteiros automatizados, que encontraram e corrigiram bugs como:

- locais gerados aparecendo **na água** → o mapa agora confere cada ponto contra a camada de água antes de mostrar o pin;
- botões do Android ilegíveis → faixa roxa com ícones claros;
- botão **+** escondido atrás do cartão do local; menu sobre a barra do Android;
- ícone padrão do React Native na abertura → abertura com a marca;
- alertas padrão do Android → diálogos com a identidade do app;
- envio duplicado com toque duplo, GPS travando e limite de armazenamento.

### Protótipo e marca

Protótipo navegável com todas as telas, regras de negócio, modelo de dados, relação com a fundamentação teórica e a marca: **escudo com o símbolo feminino sobre um mapa dobrado** (violeta `#5B2A86`, noite `#2B1446`, coral `#F2A28F`, lavanda `#E9DFF5`).

## Como foi feito

| Etapa | O que aconteceu |
|---|---|
| 1. Análise | Levantamento das telas e das regras a partir da descrição do sistema e da fundamentação teórica; análise do backend inicial (`develop`) com as lacunas encontradas. |
| 2. Protótipo | Todas as telas desenhadas e navegáveis (24 quadros), com responsividade, regras de negócio (RN01–RN19), modelo de dados e marca. Decisões tomadas junto com a equipe: check-in de 100 m, verificação facial simulada (sem custo), autoria pelo token, alerta de local não aconselhado. |
| 3. Backend | Estrutura completa em Spring Boot por funcionalidade (`controller → service → repository`), PostGIS para as consultas geográficas e Flyway para o banco. |
| 4. Testes da API | 73 testes de todos os endpoints contra um PostgreSQL + PostGIS real (Testcontainers). Encontraram 2 bugs reais (entre eles a busca com filtros vazios), já corrigidos. |
| 5. App de teste | Primeira versão do app em Expo/React Native, sem servidor, com dados de demonstração. Serviu para avaliar telas e fluxos e depois foi substituída pela versão conectada à API. |
| 6. Testes no celular | Roteiros automatizados num Android real (via USB/adb) cobrindo cadastro, login, mapa, busca, cadastro de local, check-in, avisos, comentários, alerta, perfil e casos de erro (campos vazios, duplicados, toque duplo). |
| 7. Correções | Bugs encontrados no aparelho e corrigidos: locais na água, botões do Android ilegíveis, **+** escondido atrás do cartão, menu sobre a barra do Android, ícone padrão na abertura, alertas sem a identidade do app e campos sem rótulo para leitor de tela. |
| 8. Integração | App conectado à API, sem carga automática de dados: o banco começa vazio e os registros vêm do uso real. Publicação em Neon, Render e Vercel em andamento. |

### O que das correções vale para o backend

As correções da etapa 7 são de **interface do app** (mapa, barra do Android, diálogos, acessibilidade), por isso o código delas está em `mobile/`. Para o backend ficam as regras e decisões:

- **Toque duplo / envio repetido:** o backend já recusa local duplicado a menos de 50 m; o app também bloqueia o segundo envio.
- **Sem carga automática:** nem o backend nem o app geram registros sozinhos.

## Arquitetura

```
┌──────────────────────┐        REST + JWT        ┌──────────────────────────┐
│  App React Native    │ ───────────────────────► │  Java 21 + Spring Boot 4 │
│  (Expo, Android/iOS) │                          │  regras, autenticação,   │
│  MapLibre + OSM      │                          │  avaliações, avisos      │
└──────────────────────┘                          └────────────┬─────────────┘
                                                               │
                                                  ┌────────────▼─────────────┐
                                                  │  PostgreSQL + PostGIS    │
                                                  └──────────────────────────┘
```

| Camada | Tecnologias |
|---|---|
| Mobile | React Native, Expo, TypeScript, MapLibre GL, OpenStreetMap |
| Backend | Java 21, Spring Boot 4, Spring Security (JWT), JPA/Hibernate, Flyway |
| Banco | PostgreSQL 16 + PostGIS (consultas por área, distância e proximidade) |
| Testes | JUnit, MockMvc, Testcontainers |

## Privacidade

- Coleta mínima: do check-in guarda-se só a **distância**, nunca a posição da usuária.
- Publicação **anônima** opcional (o vínculo fica guardado apenas para moderação).
- Biometria só com consentimento e sem armazenar imagem.
- Denúncia e moderação de conteúdo.

## Próximos passos

1. Publicar a API e a landing page e testar o app em celulares.
2. Armazenamento de fotos (MinIO/S3/Cloudinary).
3. Documentação OpenAPI da API.
4. Notificações push e moderação assistida por NLP.
5. Estudo do modo de alerta (contatos de confiança e compartilhamento de localização).

## Contexto acadêmico

Conceitos estudados: segurança feminina, percepção de segurança, crowdsourcing, sistemas colaborativos, Informação Geográfica Voluntária (VGI), geolocalização, privacidade e anonimato. Trabalhos relacionados: **Safetipin**, **HarassMap** e **Safecity**.

## Imagens de exemplo

Os dados que aparecem no protótipo e nos prints da landing page — locais, usuárias, notas e comentários — **foram criados por IA para exemplificar um cenário real**. Não representam pessoas nem estabelecimentos reais.

## Licença

Ainda será definida.
