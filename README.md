# GoSafe
GoSafe é um aplicativo colaborativo voltado à segurança feminina, permitindo que mulheres avaliem locais, compartilhem relatos e consultem informações sobre a percepção de segurança de espaços públicos e privados.

A proposta é criar uma rede colaborativa em que experiências individuais possam gerar informações úteis para outras mulheres antes de frequentarem determinados locais.

Projeto acadêmico em desenvolvimento.

Objetivo

Desenvolver uma aplicação que permita às usuárias:

consultar avaliações de locais;
avaliar a percepção de segurança de estabelecimentos e espaços;
registrar relatos e experiências;
visualizar informações georreferenciadas;
buscar locais por nome, categoria ou localização;
contribuir colaborativamente com informações para outras usuárias.

O GoSafe não pretende determinar se um local é objetivamente seguro ou inseguro. As informações apresentadas representam percepções e experiências compartilhadas pela comunidade.

Funcionalidades previstas
Avaliação de locais

As usuárias poderão avaliar diferentes aspectos relacionados à percepção de segurança de um local, como:

segurança percebida;
iluminação;
visibilidade;
movimentação de pessoas;
atendimento;
possibilidade de conseguir ajuda.

Também será possível adicionar um comentário ou relato opcional sobre a experiência.

Relatos

O sistema permitirá registrar relatos associados a locais específicos.

Os relatos poderão ser classificados em categorias, como:

assédio;
discriminação;
comportamento inadequado;
falta de segurança;
outras situações relevantes.

A identidade pública da usuária poderá ser preservada.

Mapa colaborativo

Os locais e avaliações serão apresentados em um mapa, permitindo:

visualizar estabelecimentos próximos;
consultar avaliações;
visualizar relatos associados aos locais;
identificar regiões com maior concentração de avaliações;
consultar indicadores de percepção de segurança.
Busca e filtros

Será possível buscar e filtrar locais por critérios como:

nome;
categoria;
localização;
avaliação;
distância.
Sistema colaborativo

As informações disponíveis no GoSafe serão construídas a partir das contribuições das próprias usuárias.

Também poderão ser estudados mecanismos para:

apoiar avaliações e relatos;
denunciar conteúdos inadequados;
reduzir avaliações falsas;
aumentar a confiabilidade das informações.
Modo de alerta

O projeto prevê o estudo de funcionalidades relacionadas a situações de emergência, como:

compartilhamento de localização;
contatos de confiança;
acionamento rápido de um protocolo de alerta;
envio de notificações.

A implementação definitiva dependerá das permissões e limitações existentes nos sistemas Android e iOS.

Tecnologias
Mobile
React Native
TypeScript
Android
iOS
Backend
Java
Spring Boot
API REST

O backend será responsável pelas regras de negócio, autenticação, avaliações, relatos e comunicação com o banco de dados.

Banco de dados
PostgreSQL
PostGIS

O PostgreSQL será utilizado como banco de dados principal.

A extensão PostGIS será utilizada para trabalhar com informações geográficas, permitindo consultas de:

distância;
proximidade;
coordenadas;
estabelecimentos próximos;
regiões exibidas no mapa.
Mapas
MapLibre
OpenStreetMap

O MapLibre será utilizado para a visualização dos mapas, utilizando dados cartográficos baseados no OpenStreetMap.

Recursos futuros

Também poderão ser estudadas tecnologias para:

Processamento de Linguagem Natural (NLP);
moderação automática de relatos;
notificações push;
análise de conteúdo;
funcionalidades de emergência.

Arquitetura inicial

                   ┌─────────────────────┐
                   │    React Native     │
                   │    Android / iOS    │
                   └──────────┬──────────┘
                              │
                           REST API
                              │
                              ▼
                   ┌─────────────────────┐
                   │  Java + Spring Boot │
                   │                     │
                   │  Regras de negócio │
                   │  Autenticação      │
                   │  Avaliações        │
                   │  Relatos           │
                   │  Geolocalização    │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │ PostgreSQL + PostGIS│
                   └─────────────────────┘


React Native
     │
     └──────────────► MapLibre / OpenStreetMap

Conceitos relacionados

O desenvolvimento do GoSafe considera conceitos como:

segurança feminina;
percepção de segurança;
crowdsourcing;
sistemas colaborativos;
geolocalização;
Informação Geográfica Voluntária (VGI);
privacidade;
anonimato.


Trabalhos relacionados

O projeto possui relação com aplicações e pesquisas que utilizam tecnologia e participação colaborativa para abordar questões relacionadas à segurança feminina.

Entre os principais trabalhos estudados estão:

Safetipin — aplicação voltada à avaliação colaborativa da segurança urbana;
HarassMap — plataforma de mapeamento colaborativo de relatos de assédio;
Safecity — plataforma de relatos anônimos e georreferenciados relacionados a assédio e violência.

O GoSafe busca combinar conceitos presentes nessas soluções, com foco na avaliação de locais públicos e privados e no compartilhamento de experiências entre mulheres.



Privacidade e segurança

Como a aplicação poderá lidar com informações sensíveis, privacidade e proteção de dados serão consideradas desde o desenvolvimento.

Entre os princípios previstos estão:

proteção da identidade das usuárias;
coleta mínima de dados pessoais;
proteção dos dados de localização;
controle de acesso às informações;
anonimato público em determinados relatos;
prevenção da exposição indevida de dados de terceiros;
mecanismos de denúncia e moderação.



## Estrutura do projeto

```
GoSafe/
├── gosafe-backend/   API Java 21 + Spring Boot 4, PostgreSQL + PostGIS (ver gosafe-backend/README.md)
├── mobile/           App Expo + React Native + TypeScript (branch test/mobile-offline, ver mobile/README.md)
└── README.md
```

| Branch | Conteúdo |
|---|---|
| `develop` | Base inicial do backend |
| `feature/estrutura-backend` | Backend completo: JWT, PostGIS, endereço estruturado, check-in, reputação ponderada, avisos, comentários, favoritos, denúncias, verificação facial simulada, alerta de local não aconselhado e 73 testes |
| `test/mobile-offline` | Tudo acima + app de teste que roda 100% no aparelho, com carga de dados e gerador de locais no mapa |

## Como rodar

**Backend** (Java 21 + Docker):

```bash
cd gosafe-backend
./mvnw test                                              # 73 testes, incluindo PostGIS real
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev    # API + carga mínima (2 usuárias, 5 locais)
```

**App de teste** (Node 20 + Android SDK, celular em modo desenvolvedor):

```bash
cd mobile
npm install
npm run test:data                                        # 15 testes da lógica offline
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/release/app-release.apk
```

## Regras de negócio implementadas

- Avaliação com 5 parâmetros de 1 a 5: segurança, iluminação, movimento, acolhimento e banheiro (banheiro aceita "não há").
- Nota do local = média ponderada pelo peso de cada voto; vale só a avaliação mais recente de cada usuária.
- Peso do perfil de 0,1 a 1,0 (tempo de conta, contribuições válidas, verificação, denúncias procedentes), com bônus para quem avalia com check-in.
- Check-in a até 100 m do local, descontada a precisão do GPS, um por local a cada 4 h; só a distância é guardada.
- Comentários existem apenas dentro de avisos, e avisos apenas dentro de locais; publicação anônima opcional.
- **Local não aconselhado (RN18):** com 100 usuárias ou mais avaliando (5 na versão de teste) e nota ponderada até 1,5, o local recebe alerta no mapa, na lista e na página.
- Verificação facial opcional e simulada, sem guardar imagem (LGPD art. 11).

## Dados de demonstração

Todos os dados de demonstração do projeto — locais, usuárias, notas e comentários, tanto no protótipo quanto no app de teste e na carga do backend — **foram criados por IA para exemplificar um cenário real**. Não representam pessoas nem estabelecimentos reais.

## Marca

Escudo com o símbolo feminino sobre um mapa dobrado: proteção, mulheres e lugares. Cores: noite `#2B1446`, violeta `#5B2A86`, coral `#F2A28F`, lavanda `#E9DFF5`. Os ícones do app ficam em `mobile/assets`.

Contexto acadêmico

O GoSafe está sendo desenvolvido como parte de um Trabalho de Conclusão de Curso (TCC).

Além do desenvolvimento da aplicação, o projeto envolve estudos sobre:

segurança feminina;
percepção de segurança;
sistemas colaborativos;
crowdsourcing;
geolocalização;
privacidade e proteção de dados;
tecnologias aplicadas ao compartilhamento de informações.
Status

🚧 Em desenvolvimento

- Backend implementado e testado (73 testes contra PostgreSQL + PostGIS).
- Protótipo de telas completo, incluindo responsividade, vantagens e alerta de local não aconselhado.
- App de teste offline instalável no Android, com dados de demonstração gerados por IA.
- Próximos passos: integrar o app ao backend, armazenamento de fotos, documentação OpenAPI e notificações.

Licença

A licença do projeto ainda será definida.
     
