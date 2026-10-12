# GoSafe — versões de teste

Arquivos instaláveis do app, separados do código do projeto (`gosafe-backend/` e `mobile/`).

## mobile-teste-v0.1.1 — app offline para Android (atual)

| | |
|---|---|
| Arquivo | [`mobile-teste-v0.1.1/GoSafe-Teste-v0.1.1.apk`](mobile-teste-v0.1.1/GoSafe-Teste-v0.1.1.apk) |
| Tamanho | 32 MB |
| SHA-256 | `a0cdd8ae490a8cd7a1a5df0399baa4556f6eae36f63839b6b398fbe969cd1b21` |
| Plataforma | Android, arm64 (celulares atuais) |
| Pacote | `com.gosafe.test` — nome no aparelho: **GoSafe Teste** |
| Código-fonte | branch `test/mobile-offline`, pasta `mobile/` |
| Gerado em | 12/10/2026, build release (Expo SDK 57, React Native 0.86) |

### Novidades da v0.1.1 (correções dos testes no aparelho)

- Locais nunca aparecem na água: o mapa confere cada ponto contra a camada de água antes de mostrar o pin.
- Botões do Android legíveis: faixa roxa com ícones claros em todas as telas.
- Abertura com a marca GoSafe (antes aparecia o ícone padrão do React Native).
- Diálogos de erro e confirmação com a identidade do app.
- Menu do **+** acima da barra do Android; **+** e centralizar sobem quando o cartão de um local está aberto (antes o toque no + abria o local).
- Leitor de tela anuncia o nome de cada campo e se o local já é favorito.

Versão anterior: v0.1.0 (disponível no histórico do Git).

> **Todos os dados deste app de teste — locais, usuárias, notas e comentários — foram criados por IA para exemplificar um cenário real.** Não representam pessoas nem estabelecimentos reais.

### Como instalar

**Pelo celular:** baixe o `.apk` desta pasta no GitHub (botão *Download raw file*), abra o arquivo e permita a instalação de apps desta fonte quando o Android pedir.

**Pelo computador** (celular com depuração USB ativa):

```bash
adb install -r releases/mobile-teste-v0.1.1/GoSafe-Teste-v0.1.1.apk
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
