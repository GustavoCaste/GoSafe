# GoSafe — app mobile (versão de teste offline)

Expo (SDK 57) + React Native + TypeScript. Nesta branch (`test/mobile-offline`) o app **não fala com o backend**: tudo fica salvo no aparelho (AsyncStorage) e as regras de negócio são as mesmas do backend (`src/domain/rules.ts`). A internet é usada **apenas** para desenhar o mapa (MapLibre GL + tiles OpenFreeMap/OpenStreetMap).

> **Todos os dados deste app de teste — locais, usuárias, notas e comentários — foram criados por IA para exemplificar um cenário real.** O app avisa isso nas boas-vindas, no login, na tela de vantagens, no perfil e na página de cada local.

## Testes

```bash
npm run typecheck   # tipagem
npm run test:data   # 15 testes: carga de dados, RN18, nota ponderada, check-in, duplicidade, anonimato, gerador do mapa
```

## Instalar no celular (USB, modo desenvolvedor)

```bash
cd mobile
npm install
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/release/app-release.apk
```

Em aparelhos Xiaomi/POCO é preciso ativar também **"Instalar via USB"** nas opções do desenvolvedor.

## Massa de dados

Criada no primeiro acesso, em volta da sua localização (ou do centro de São Paulo, se a permissão for negada):

| | |
|---|---|
| Sua conta | usuária `teste`, senha `gosafe123` |
| 50 usuárias | `seed01` … `seed50`, senha `gosafe123` (1 em cada 5 verificada) |
| 2 locais quase perfeitos | Café Aurora e Academia Movimento (~5,0) |
| 5 locais não aconselhados | Terminal Leste, Bar do Porto, Praça das Flores, Passarela da Mooca, Ponto Final 12 (~1,0, com alerta) |
| 13 locais variados | notas de ~2,1 a ~4,6 |

**Locais ilustrativos:** ao navegar pelo mapa (zoom de bairro), cada área nova de ~1 km ganha de 0 a 2 locais `Local Teste N`, com notas, comentários e usuárias aleatórias — alguns já nascem com alerta. Afaste o zoom e o gerador para.

Para recomeçar do zero: **Meus dados → Recriar dados de teste**.

## Roteiro de testes

1. **Primeiro acesso:** boas-vindas → "Por que usar o GoSafe" (vantagens, cada uma com um exemplo visível do app) → permissão de localização → login. Teste também negar a permissão (locais vão para São Paulo).
2. **Cadastro:** criar conta com dados inválidos (e-mail, senha < 8, usuária repetida) e depois válidos → verificação facial simulada (opcional).
3. **Mapa:** arrastar e dar zoom → os pins carregam pela área visível e surgem `Local Teste N`; filtros por categoria; tocar num pin abre o cartão; pins vermelhos com "!" são não aconselhados.
4. **Local:** nota ponderada geral e por parâmetro, alerta, favoritar, check-in real (precisa estar a até 100 m, descontada a precisão do GPS) e "Simular check-in" para testar de longe.
5. **Aviso e comentário:** criar aviso com e sem avaliação, anônimo ou não; comentar avaliando; banheiro "Não há"; ver o peso do voto subir com check-in.
6. **Regra do alerta (RN18):** num local com menos de 5 avaliações, entre com 5 contas diferentes (`seed..`) e dê notas 1 → o local passa a "não aconselhado". Removendo um comentário, o alerta pode sumir.
7. **Listas:** Locais (mais próximos / melhor nota / só com alerta), Favoritos, Busca e Cadastrar local (duplicado a menos de 50 m é bloqueado).
8. **Perfil:** peso de reputação, contadores, sair e entrar com outra conta.

## Marca

Escudo violeta com o símbolo feminino em coral, sobre um mapa dobrado com rota tracejada. Os arquivos gerados ficam em `assets/` (ícone, ícone adaptativo e monocromático do Android, splash e favicon); para regerar, use `npx expo prebuild --platform android` antes do build.
