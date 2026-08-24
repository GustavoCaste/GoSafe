# GoSafe
GoSafe é um aplicativo colaborativo voltado à segurança feminina, permitindo que mulheres avaliem locais, compartilhem relatos e consultem informações sobre a percepção de segurança de espaços públicos e privados.

A proposta é construir uma rede colaborativa na qual experiências individuais possam gerar informações úteis para outras mulheres antes de frequentarem determinados locais.

Status: Projeto acadêmico em desenvolvimento.

Objetivo

Desenvolver uma aplicação que permita às usuárias:

consultar avaliações de locais;
avaliar a percepção de segurança de estabelecimentos e espaços;
registrar relatos e experiências;
visualizar informações georreferenciadas;
identificar locais com avaliações positivas ou negativas;
contribuir de forma colaborativa com informações para outras usuárias.

O GoSafe não pretende determinar se um local é objetivamente seguro ou inseguro. As informações apresentadas representam percepções e experiências compartilhadas pela comunidade.

Funcionalidades previstas
Check-in e avaliação
Busca de locais pelo mapa;
Check-in em estabelecimentos;
Avaliação de critérios relacionados à segurança;
Registro opcional de comentários e experiências.
Relatos
Relatos associados a locais;
Categorias como assédio, discriminação e falta de segurança;
Possibilidade de preservar a identidade pública da usuária;
Consulta de relatos realizados por outras usuárias.
Mapa colaborativo
Visualização dos locais avaliados;
Informações georreferenciadas;
Indicadores de percepção de segurança;
Visualização de regiões com maior concentração de avaliações e relatos.
Busca de locais
Busca por nome ou localização;
Filtros por categoria;
Consulta das avaliações antes de frequentar um local.
Rede colaborativa
Participação das usuárias na construção das informações;
Possibilidade de apoiar contribuições da comunidade;
Mecanismos para aumentar a confiabilidade das avaliações.
Modo de alerta

Está prevista a investigação de funcionalidades relacionadas a situações de emergência, incluindo:

compartilhamento de localização;
contatos de confiança;
acionamento rápido de um protocolo de alerta.

A implementação definitiva dependerá das limitações e permissões disponíveis nos sistemas Android e iOS.

Tecnologias
Mobile
React Native
Android
iOS
Backend
Java
Spring Boot
API REST
Banco de dados
PostgreSQL
PostGIS

O PostGIS será utilizado para consultas geográficas, como distância, proximidade e localização de estabelecimentos.

Mapas
MapLibre
OpenStreetMap
Recursos futuros
Processamento de Linguagem Natural (NLP);
Moderação automática de relatos;
Notificações;
Recursos de emergência.
Arquitetura inicial
┌───────────────────────┐
│      React Native     │
│    Android / iOS      │
└───────────┬───────────┘
            │
            │ REST API
            ▼
┌───────────────────────┐
│   Java + Spring Boot  │
│                       │
│  Regras de negócio    │
│  Autenticação         │
│  Avaliações           │
│  Relatos              │
│  Geolocalização       │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ PostgreSQL + PostGIS  │
└───────────────────────┘

React Native
     │
     └────────► MapLibre / OpenStreetMap
Conceitos utilizados

O desenvolvimento do GoSafe considera conceitos como:

segurança feminina;
percepção de segurança;
crowdsourcing;
sistemas colaborativos;
geolocalização;
Informação Geográfica Voluntária (VGI);
privacidade e anonimato.
Trabalhos relacionados

A proposta possui relação com projetos e pesquisas que utilizam tecnologia e colaboração para abordar segurança feminina, principalmente:

Safetipin — avaliação colaborativa da segurança urbana;
HarassMap — mapeamento colaborativo de relatos de assédio;
Safecity — relatos anônimos e georreferenciados sobre assédio e violência.

O GoSafe busca combinar avaliações estruturadas de locais com relatos colaborativos, com maior foco em estabelecimentos públicos e privados.

Estrutura do projeto

A estrutura definitiva será definida durante o desenvolvimento. Inicialmente, o projeto poderá ser dividido em:

GoSafe/
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
Privacidade

Por lidar com informações potencialmente sensíveis, privacidade e proteção de dados fazem parte dos requisitos centrais do projeto.

Entre os princípios considerados estão:

proteção da identidade das usuárias;
coleta mínima de dados pessoais;
controle de acesso às informações;
proteção de dados de localização;
prevenção da exposição indevida de terceiros;
possibilidade de anonimato público nos relatos.
Contexto acadêmico

O GoSafe está sendo desenvolvido como projeto acadêmico de Trabalho de Conclusão de Curso (TCC).

Além do desenvolvimento da aplicação, o projeto envolve pesquisa sobre segurança feminina, percepção de segurança, sistemas colaborativos, geolocalização e tecnologias aplicadas à construção de informações coletivas.

Licença

A licença do projeto ainda será definida.
