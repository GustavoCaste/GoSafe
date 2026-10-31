# GoSafe — landing page (proposta para discussão)

Página de apresentação do GoSafe para a banca e para quem for testar o app. Ainda **não foi publicada**: está nesta branch para o grupo avaliar.

## Como abrir

Dê dois cliques em `index.html`. A página funciona direto do disco, sem servidor. Com internet, carrega as fontes da marca (Google Fonts); sem internet, usa as fontes do sistema.

A seção **Experimente** baixa o app conectado à API em `downloads/GoSafe.apk`. Esse arquivo entra na pasta quando o APK final for gerado com o endereço da API no Render.

## O que tem

1. Abertura com a proposta e as telas do app
2. O problema, com os dados da pesquisa Visível e Invisível (FBSP, 2025)
3. Como funciona, em 4 passos com prints reais do app
4. Notas confiáveis: o exemplo de nota ponderada da Tabela 31
5. Privacidade e LGPD
6. Arquitetura, tecnologias e números de testes
7. Experimente: download do app, contas de demonstração e aviso de dados criados por IA

## Antes de publicar (se o grupo decidir)

- Preencher os nomes dos autores no rodapé (`[NOMES DOS AUTORES]`). Curso e instituição já estão: Engenharia de Software, UCSal.
- A tela do mapa (`assets/tela-mapa.png`) vem do protótipo; as demais são prints do app rodando em emulador Android.
- Na Vercel: Root Directory `landing`, Framework `Other`, sem comando de build.
