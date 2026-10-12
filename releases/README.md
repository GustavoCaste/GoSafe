# GoSafe — versões de teste

Arquivos instaláveis do app, separados do código do projeto (`gosafe-backend/` e `mobile/`).

## mobile-teste-v0.1.0 — app offline para Android

| | |
|---|---|
| Arquivo | [`mobile-teste-v0.1.0/GoSafe-Teste-v0.1.0.apk`](mobile-teste-v0.1.0/GoSafe-Teste-v0.1.0.apk) |
| Tamanho | 32 MB |
| SHA-256 | `e915f9d33d8cb817eaad5a5382ff1c3f38fd22ea18e5854f04f3347dc8995b8f` |
| Plataforma | Android, arm64 (celulares atuais) |
| Pacote | `com.gosafe.test` — nome no aparelho: **GoSafe Teste** |
| Código-fonte | branch `test/mobile-offline`, pasta `mobile/` |
| Gerado em | 12/10/2026, build release (Expo SDK 57, React Native 0.86) |

> **Todos os dados deste app de teste — locais, usuárias, notas e comentários — foram criados por IA para exemplificar um cenário real.** Não representam pessoas nem estabelecimentos reais.

### Como instalar

**Pelo celular:** baixe o `.apk` desta pasta no GitHub (botão *Download raw file*), abra o arquivo e permita a instalação de apps desta fonte quando o Android pedir.

**Pelo computador** (celular com depuração USB ativa):

```bash
adb install -r releases/mobile-teste-v0.1.0/GoSafe-Teste-v0.1.0.apk
```

Em Xiaomi/POCO, ative também **"Instalar via USB"** nas opções do desenvolvedor.

### Contas de teste

| Conta | Senha | Observação |
|---|---|---|
| `teste` | `gosafe123` | Conta para quem está testando (recém-criada, não verificada) |
| `seed01` … `seed50` | `gosafe123` | 50 usuárias da carga; 1 em cada 5 é verificada |

### O que funciona

- Todas as telas do protótipo: boas-vindas, **Por que usar o GoSafe** (vantagens com exemplos), permissão de localização, login, cadastro, verificação facial simulada, mapa, locais, favoritos, busca, cadastro de local, página do local, avisos e comentários, perfil.
- Os dados ficam **só no aparelho**; a internet é usada apenas para desenhar o mapa (MapLibre + OpenStreetMap).
- Carga inicial em volta da sua localização (ou do centro de São Paulo, sem permissão):

| Grupo | Locais | Nota |
|---|---|---|
| Quase perfeitos | Café Aurora, Academia Movimento | ~5,0 |
| Não aconselhados (com alerta) | Terminal Leste, Bar do Porto, Praça das Flores, Passarela da Mooca, Ponto Final 12 | ~1,0 |
| Variados | 13 locais | ~2,1 a ~4,6 |

- Ao navegar pelo mapa (zoom de bairro) surgem locais ilustrativos **Local Teste N**, com notas, comentários e usuárias aleatórias.
- Regras iguais às do backend: nota ponderada, peso por reputação, check-in a até 100 m (com opção "Simular check-in" para testar de longe), local não aconselhado a partir de 5 avaliações com nota ≤ 1,5 (100 no app real).
- Para recomeçar do zero: **Meus dados → Recriar dados de teste**.

### Limitações desta versão

- Não se comunica com o backend; cada aparelho tem sua própria massa de dados.
- Verificação facial e geocodificação de endereço são simuladas.
- Fotos dos locais aparecem como espaço reservado.

O roteiro completo de testes está em [`mobile/README.md`](../mobile/README.md).
