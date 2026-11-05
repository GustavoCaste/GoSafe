# GoSafe — landing page

Página de apresentação do GoSafe para a banca e para quem for testar o app. Publicada na Vercel a partir desta pasta.

## Como abrir

Dê dois cliques em `index.html`. A página funciona direto do disco, sem servidor. Com internet, carrega as fontes da marca (Google Fonts); sem internet, usa as fontes do sistema.

A seção **Experimente** baixa o app em `downloads/GoSafe.apk`, gerado apontando para a API no Render (`https://gosafe-api.onrender.com`).

## O que tem

1. Abertura com a proposta e as telas do app
2. O problema, com os dados da pesquisa Visível e Invisível (FBSP, 2025)
3. Como funciona, em 4 passos com prints reais do app
4. Notas confiáveis: o exemplo de nota ponderada da Tabela 31
5. Privacidade e LGPD
6. Arquitetura, tecnologias e números de testes
7. Experimente: download do app e aviso sobre as imagens de exemplo

## Publicação

Os prints vêm do app rodando em emulador Android. O APK fica versionado em `downloads/GoSafe.apk`, então a Vercel o publica junto com a página. Se ele faltar no Git, a Vercel devolve uma página de erro no lugar do arquivo, e o celular baixa algo que não instala.

Para trocar o APK, gere de novo e faça o commit do arquivo:

```powershell
.\mobile\scripts\gerar-apk.ps1 -ApiUrl https://gosafe-api.onrender.com
git add -f landing/downloads/GoSafe.apk
```
