# Carga inicial de Salvador

Base com 353 locais e 1.072 avaliações **estimadas**, aplicada pelo Flyway na primeira subida do banco (`src/main/resources/db/seed/V2_1__carga_inicial_salvador.sql`). As notas não vêm de usuárias do GoSafe, e cada comentário traz esse aviso.

| Arquivo | Conteúdo |
|---|---|
| `locais.csv` | Locais, já com CEP e coordenadas conferidos |
| `avaliacoes.csv` | Notas, títulos e comentários por local |
| `fontes.csv`, `fontes_lista.md` | Fonte de cada local |
| `removidos.csv` | 454 registros retirados por estarem fora do escopo |
| `conferencia_enderecos.json` | Respostas do ViaCEP e do Nominatim usadas na conferência |
| `gerar_carga.py` | Gera a migração a partir dos CSVs |

Depois que a migração for aplicada em um banco publicado, não a edite: o Flyway recusa arquivo alterado. Corrija com uma nova migração em `db/migration`.

Para gerar de novo em um banco que ainda não recebeu a carga:

```bash
python gerar_carga.py sql
```

Para subir sem a carga, defina `SPRING_FLYWAY_LOCATIONS=classpath:db/migration`.
