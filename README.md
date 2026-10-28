# GoSafe

**Aplicativo colaborativo de segurança feminina.** Mulheres avaliam locais (cafés, bares, pontos de ônibus, praças…), publicam avisos e consultam, antes de sair de casa, como outras mulheres se sentiram naquele lugar.

> O GoSafe não pretende determinar se um local é objetivamente seguro ou inseguro. As informações apresentadas representam **percepções e experiências** compartilhadas pela comunidade, ponderadas pela confiabilidade de quem avaliou.

Projeto de Trabalho de Conclusão de Curso (TCC) — 🚧 em desenvolvimento.

---

## Situação atual

| Parte | Situação |
|---|---|
| **Backend** (`gosafe-backend/`) | Implementado: API REST com autenticação, locais, avaliações, avisos, denúncias e moderação. Ainda sem implantação. Há 73 testes automatizados implementados, mas só os 10 unitários foram executados e aprovados (ver [Testes](#testes)). |
| **Protótipo mobile offline** | Existe na branch `test/mobile-offline`. Guarda os dados só no aparelho e **não usa o backend**. |
| **Aplicativo mobile de cadastro** | **Desenvolvimento local, ainda não versionado nesta branch** e **não integrado à versão atual do backend**. Não é uma funcionalidade entregue. Foi escrito para o contrato inicial da API (`POST /users`) e precisaria ser atualizado para o atual (`POST /auth/register`). |
| **Integração app ↔ backend** | Ainda não existe. |

## Objetivo

Desenvolver uma aplicação que permita às usuárias:

- consultar avaliações de locais;
- avaliar a percepção de segurança de estabelecimentos e espaços;
- registrar relatos e experiências;
- visualizar informações georreferenciadas;
- buscar locais por nome, categoria ou localização;
- contribuir colaborativamente com informações para outras usuárias.

## Como o sistema funciona

1. **Cadastro e login** com nome, nome de usuária, e-mail, senha e sexo. A verificação de identidade é **opcional** e, por enquanto, **simulada**.
2. **Mapa:** os locais da área visível são carregados conforme o mapa se move. O pin mostra a nota e destaca os locais **não aconselhados**.
3. **Locais:** lista com busca, filtros, ordenação por distância, nota ou nome, e favoritos.
4. **Página do local:** nota geral e por parâmetro, check-in e o **fórum de avisos**. Cada aviso tem comentários, e cada comentário pode trazer uma avaliação.

### Como a nota é calculada

- Cada avaliação tem **5 parâmetros** de 1 a 5: segurança, iluminação, movimento, acolhimento e banheiro (que aceita "não há").
- A nota do local é uma **média ponderada pelo peso de quem votou**. O peso vai de 0,1 a 1,0 e cresce com o tempo de conta, as contribuições válidas e a verificação, e cai com denúncias procedentes. A fórmula se inspira em Bishr e Mantelas (2008), e os coeficientes são um ponto de partida a calibrar.
- Quem avalia **estando no local** (check-in a até 100 m) recebe um bônus no peso do voto.
- Vale só a avaliação mais recente de cada usuária em cada local.
- **Local não aconselhado (RN18):** quando pelo menos 100 usuárias avaliaram o local e a nota ponderada é de 1,5 ou menos, ele recebe um alerta. Esses limites são configuráveis (ver o [README do backend](gosafe-backend/README.md)).

## Funcionalidades previstas

Itens do planejamento inicial que **ainda não estão implementados**:

- **Modo de alerta:** compartilhamento de localização, contatos de confiança, acionamento rápido de um protocolo de alerta e envio de notificações. A implementação depende das permissões e limitações do Android e do iOS.
- **Mapas no aplicativo** com MapLibre e dados do OpenStreetMap.
- **Recursos futuros:** processamento de linguagem natural (NLP), moderação automática de relatos, notificações push e análise de conteúdo.
- **Mecanismos adicionais de confiabilidade:** apoiar avaliações e relatos e reduzir avaliações falsas. Hoje o sistema já conta com denúncias, moderação e a ponderação por reputação.

## Começo rápido (backend)

Pré-requisitos: **Java 21** e **Docker** em execução.

```bash
cd gosafe-backend
./mvnw test                                              # os testes de integração sobem um PostGIS via Testcontainers
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev    # API + carga mínima de desenvolvimento
```

A carga mínima cria 2 usuárias fictícias — `dev@gosafe.dev` e `usuaria@gosafe.dev`, ambas com a senha pública `gosafe123` — e 5 locais com avisos e avaliações. **É só para desenvolvimento.** Sem o perfil `dev`, o banco começa vazio.

Endpoints, configurações, estrutura do código e testes: [`gosafe-backend/README.md`](gosafe-backend/README.md).

### Testes

O código do backend tem **73 métodos de teste implementados**: 10 unitários, 61 de integração da API e 2 de contexto e fluxo completo. Até o momento, **somente os 10 testes unitários foram executados e aprovados**. Os outros 63 estão implementados, mas ainda não tiveram uma execução registrada.

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Backend | Java 21, Spring Boot 4, Spring Security (JWT), JPA/Hibernate, Flyway |
| Banco | PostgreSQL 16 + PostGIS: consultas por área, distância e proximidade |
| Testes | JUnit, MockMvc, Testcontainers |
| Mobile | React Native e TypeScript (Expo) |
| Mapas (previsto) | MapLibre e OpenStreetMap |

O OpenStreetMap (Nominatim) e o ViaCEP são usados pelo backend para obter coordenadas e endereços.

### Arquitetura

```
┌──────────────────────┐        REST + JWT        ┌──────────────────────────┐
│  App React Native    │ ───────────────────────► │  Java 21 + Spring Boot 4 │
│  (Android / iOS)     │                          │  regras, autenticação,   │
│                      │                          │  avaliações, avisos      │
└──────────────────────┘                          └────────────┬─────────────┘
                                                               │
                                                  ┌────────────▼─────────────┐
                                                  │  PostgreSQL + PostGIS    │
                                                  └──────────────────────────┘
```

## Estrutura do repositório

```
GoSafe/
├── gosafe-backend/   API Java + Spring Boot
└── README.md
```

Esta branch não versiona nenhum aplicativo mobile. O protótipo offline está na branch `test/mobile-offline`, e o aplicativo de cadastro é um desenvolvimento local ainda não versionado.

## Limitações conhecidas

- **O aplicativo ainda não conversa com o backend atual.** O aplicativo de cadastro é um desenvolvimento local, não versionado nesta branch, e usa `POST /users`, que não existe mais. O cadastro agora é `POST /auth/register` e exige também nome de usuária e sexo.
- **Testes de integração ainda não executados.** Dos 73 métodos de teste, apenas os 10 unitários foram executados e aprovados. Os 61 de integração (que exigem Docker) e os 2 de contexto e fluxo completo estão implementados, mas sem execução registrada.
- **Segredo do JWT:** `application.properties` traz um valor padrão para desenvolvimento. A aplicação **inicia** sem a variável `GOSAFE_JWT_SECRET`, usando esse valor público, e qualquer pessoa conseguiria forjar tokens. Em qualquer ambiente acessível por outras pessoas, defina `GOSAFE_JWT_SECRET`.
- **Carga de desenvolvimento:** usa senha fixa e pública e só é protegida pelo perfil `dev`. Não deve ser ativada contra um banco real. Se a carga for interrompida no meio, a inicialização seguinte a considera concluída.
- **Alerta RN18 na carga de desenvolvimento:** com o mínimo padrão de 100 avaliadoras, nenhum dos 5 locais de exemplo dispara o alerta.
- **Verificação de identidade** simulada, sem provedor real.
- **Fotos** dos locais apenas por URL, sem armazenamento próprio.
- **Geocodificação** depende de serviços externos (ViaCEP e Nominatim), com cache em memória.
- Os coeficientes da reputação ainda precisam de calibração.

## Próximos passos

1. Atualizar o cliente mobile para o contrato atual do backend e integrar o aplicativo à API.
2. Armazenamento de fotos (MinIO, S3 ou Cloudinary).
3. Documentação OpenAPI da API.
4. Notificações push e moderação assistida por NLP.
5. Estudo do modo de alerta (contatos de confiança e compartilhamento de localização).

## Privacidade e segurança

Como a aplicação pode lidar com informações sensíveis, a privacidade e a proteção de dados são consideradas desde o desenvolvimento. Os princípios são:

- proteção da identidade das usuárias;
- coleta mínima de dados pessoais;
- proteção dos dados de localização;
- controle de acesso às informações;
- anonimato público em determinados relatos;
- prevenção da exposição indevida de dados de terceiros;
- mecanismos de denúncia e moderação.

No backend atual isso se traduz em:

- o **check-in** guarda só a **distância** até o local, nunca a posição da usuária;
- a **publicação anônima** é opcional, e o vínculo com a autora fica guardado apenas para a moderação;
- a **verificação de identidade** guarda só o resultado e a data, nunca imagem;
- a autora de qualquer conteúdo vem sempre do token, nunca do corpo da requisição.

## Contexto acadêmico

O GoSafe é desenvolvido como parte de um Trabalho de Conclusão de Curso (TCC). Além da aplicação, o projeto envolve estudos sobre segurança feminina, percepção de segurança, sistemas colaborativos, crowdsourcing, geolocalização, privacidade e proteção de dados, e tecnologias aplicadas ao compartilhamento de informações.

### Conceitos relacionados

- segurança feminina;
- percepção de segurança;
- crowdsourcing;
- sistemas colaborativos;
- geolocalização;
- Informação Geográfica Voluntária (VGI);
- privacidade;
- anonimato.

### Trabalhos relacionados

O projeto tem relação com aplicações e pesquisas que usam tecnologia e participação colaborativa para tratar da segurança feminina. Entre os principais trabalhos estudados:

- **Safetipin** — aplicação de avaliação colaborativa da segurança urbana;
- **HarassMap** — plataforma de mapeamento colaborativo de relatos de assédio;
- **Safecity** — plataforma de relatos anônimos e georreferenciados sobre assédio e violência.

O GoSafe busca combinar conceitos presentes nessas soluções, com foco na avaliação de locais públicos e privados e no compartilhamento de experiências entre mulheres.

## Dados de demonstração

Todos os dados de demonstração — locais, usuárias, notas e comentários — são fictícios e foram criados com o auxílio de IA para exemplificar um cenário real. Não representam pessoas nem estabelecimentos reais.

## Licença

A licença do projeto ainda será definida.
