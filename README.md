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



Estrutura inicial do projeto

GoSafe/

│

├── mobile/

│   └── Aplicação React Native

│

├── backend/

│   └── API Java + Spring Boot

│

├── docs/

│   └── Documentação do projeto

│

└── README.md



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

Atualmente o projeto encontra-se em fase de pesquisa, definição de requisitos e planejamento da arquitetura.

Licença

A licença do projeto ainda será definida.
     
