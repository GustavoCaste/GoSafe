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

Os prints vêm do app rodando em emulador Android. O APK fica versionado em `downloads/GoSafe.apk`, e o botão de download aponta para o arquivo bruto no GitHub (`raw.githubusercontent.com`, branch `feature/page`). Assim o download funciona mesmo com a proteção de deploy da Vercel ligada, que manda quem não tem conta no time para a tela de login.

Para trocar o APK, gere de novo e faça o commit do arquivo:

```powershell
.\mobile\scripts\gerar-apk.ps1 -ApiUrl https://gosafe-api.onrender.com
git add -f landing/downloads/GoSafe.apk
```
