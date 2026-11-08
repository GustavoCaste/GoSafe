# GoSafe — app mobile

Expo (SDK 57) + React Native + TypeScript, com mapa MapLibre + OpenStreetMap. O app conversa com a API do GoSafe: os dados vêm do servidor, e o arquivo local guarda só a sessão e o cache das últimas respostas (`src/data/api.ts`).

## Testes

```bash
npm run typecheck   # tipagem
npm run test:data   # 8 testes das regras de negócio
```

## Gerar o instalável

Defina o endereço da API em `EXPO_PUBLIC_API_URL` nos dois comandos:

```bash
EXPO_PUBLIC_API_URL=https://ENDERECO-DA-API npx expo prebuild --platform android --clean
```

```bash
cd android && EXPO_PUBLIC_API_URL=https://ENDERECO-DA-API ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

O APK sai em `android/app/build/outputs/apk/release/app-release.apk`. No Windows, se o build falhar por caminho longo, gere a partir de uma unidade curta (`subst W: <pasta do projeto>`).

Para testes internos:
- `EXPO_PUBLIC_API_URL` com `http://` libera tráfego sem criptografia, para usar uma API na rede local;
- `EXPO_PUBLIC_SHOW_SERVER_SETTINGS=true` mostra na tela de login o campo para trocar o servidor.

## Marca

Escudo violeta com o símbolo feminino em coral, sobre um mapa dobrado com rota tracejada. Os arquivos ficam em `assets/` (ícone, ícone adaptativo e monocromático do Android, splash e favicon).
