# GoSafe — landing page (proposta para discussão)

Página de apresentação do GoSafe para a banca e para quem for testar o app. Ainda **não foi publicada**: falta o endereço da API no Render para gerar o APK final.

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
7. Experimente: download do app e aviso sobre as imagens de exemplo

## Publicação

Os prints vêm do app rodando em emulador Android. O APK fica na própria Vercel: como `downloads/` não entra no Git, publique pela linha de comando, a partir desta pasta, depois de gerar o APK final:

```bash
npx vercel deploy --prod
```
