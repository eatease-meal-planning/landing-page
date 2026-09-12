# Auditoria da `001_add_security_indexes.sql` (repo `app`)

> Feita a **2026-09-11**, a pedido, depois de a TASK-11 e a TASK-23 terem
> encontrado nela três defeitos da mesma classe.
> Estado: **auditoria concluída, duas correções aplicadas, três achados novos**.
> Specs: [`delete-account.md`](./delete-account.md) · [`NEXT.md`](./NEXT.md)

## Porque é que esta migration foi auditada

É a mais antiga do projeto — 197 linhas, escrita antes de haver convenções — e
produziu **três** dos defeitos fechados nesta sessão: as duas políticas `TO
public` da `rate_limits` (TASK-11) e a `cleanup_expired_sessions()` executável
por `anon` (TASK-23). Três achados independentes na mesma origem deixam de ser
coincidência, e a pergunta certa passa a ser o que mais lá está.

**Método:** cada objecto que a `001` declara foi confrontado com o que está vivo
na BD (`pg_proc`, `pg_policies`, `information_schema`, `pg_stat_user_indexes`),
nunca com o texto da migration. Essa distinção não é pedantismo — ver o achado
**D**, que é o achado estruturante desta auditoria.

## O que a `001` cria

| Objecto | Quantos |
|---|---|
| Índices | 15 — `user_profiles` (3), `user_auth_providers` (3), `user_sessions` (5, um deles parcial), `rate_limits` (4) |
| Tabelas | 1 — `rate_limits`, mais a constraint `unique_rate_limit_window` |
| RLS | Ligada em `rate_limits`, com 2 políticas |
| Funções | 4 — `cleanup_expired_rate_limits`, `check_rate_limit`, `cleanup_expired_sessions`, `update_user_profile_secure` |
| `COMMENT` | 3 |
| `cron.schedule` | 2, **ambos comentados** (linhas 192-193). Nenhum correu; nenhuma linha de `cron.job` os referencia. |

---

## A — Políticas RLS sem cláusula `TO` · **corrigido**

As duas de `rate_limits` (`:44-48`), `USING (true)` sem `TO`, portanto `TO
public`, portanto `anon`. Fechado pela migration **122**. Detalhe completo na
TASK-11 do [`delete-account.md`](./delete-account.md).

Verificado que não há mais nenhuma: é a única tabela que a `001` cria.

## B — As **quatro** funções eram `SECURITY DEFINER` executáveis por `anon`

Não três, as quatro. O que as separa não é a exposição — é se verificam quem
chama:

| Função | Verifica o chamador? | O que fazia por `anon` | Estado |
|---|---|---|---|
| `cleanup_expired_rate_limits()` | **não** | apagava a tabela de rate limiting | fechada pela **122** |
| `check_rate_limit()` | **não** | escrevia linhas arbitrárias | fechada pela **122** |
| `cleanup_expired_sessions()` | **não** | revogava e apagava sessões de `user_sessions` | fechada pela **123** |
| `update_user_profile_secure()` | **sim**, `auth.uid() = p_user_id` | nada — devolve `'User not found or unauthorized'` | **continua executável por `anon`**, sem dano |

Todas são `SECURITY DEFINER` de `postgres`, que tem `rolbypassrls`: o RLS nunca
se aplica ao que fazem. **A quarta escapa por um `IF NOT EXISTS` de quem a
escreveu, não por desenho da migration** — três das quatro não têm travão
nenhum. É esse rácio que justifica a auditoria, e não o facto de uma delas ter
corrido bem.

## C — `search_path` mutável nas quatro · **é a TASK-22**

Todas com `proconfig` a `NULL`, isto é sem `SET search_path`. O linter do
Supabase conta **18** funções assim no projeto, destas quatro incluídas. Fica
para a TASK-22, que se faz às 18 de uma vez.

## D — **A `001` já não descreve esta base de dados.** O achado estruturante

Duas das quatro funções vivas divergem do texto da migration, e **nenhuma
migration registou a substituição**:

**`check_rate_limit`** — a viva tem **3** argumentos (`p_identifier text,
p_endpoint text, p_limit integer`); a `001` declara **4** (mais
`p_window_minutes integer DEFAULT 60`). E o corpo perdeu o guard
`current_count IS NULL OR`. É a TASK-21.

**`update_user_profile_secure`** — a lista de campos divergiu nas duas direções:
a `001` escreve `user_workout`, `user_workout_frequency`, `user_workout_goal`;
a viva escreve `weight_goal`, `weekly_weight_goal`, `activity_level`,
`fitness_goal`, `unit_preference`.

**Consequência prática, verificada:** das 20 colunas que a versão da `001`
escreve, **7 já não existem** em `user_profiles` (`calorie_goal`,
`family_members`, `fat_goal`, `protein_goal`, `user_workout`,
`user_workout_frequency`, `user_workout_goal`). **A `001` não é reaplicável a
esta base de dados** — e, porque o plpgsql não valida corpos na criação, não
falha ao ser aplicada: falha na primeira chamada, muito mais tarde.

**A regra que isto impõe, e que já pagou:** qualquer assinatura que uma migration
nova nomeie vem do `pg_get_function_identity_arguments`, nunca do ficheiro
`.sql`. Na `122` isso evitou um `REVOKE` a falhar com *function does not exist*.

## E — Achado novo: a `update_user_profile_secure` viva está morta **e** avariada

- **Morta:** zero chamadores. `grep update_user_profile_secure src supabase scripts` não devolve nada.
- **Avariada:** das 22 colunas que escreve, **4 já não existem** — `calorie_goal`, `family_members`, `fat_goal`, `protein_goal`. A primeira chamada autenticada a sério levantaria `42703 column does not exist`.
- **Inalcançável hoje:** o `auth.uid()` barra `anon` antes de chegar ao `UPDATE`, e não há chamador autenticado. Por isso nunca deu erro a ninguém.

É a mesma forma da TASK-21: uma função morta que ninguém sabe que está avariada,
à espera de ser adoptada por quem julgue que funciona. **Proposta: TASK-24**, no
mesmo lote da TASK-20 — `DROP FUNCTION`, porque corrigi-la seria escrever código
novo para zero chamadores.

## F — Achado novo: 12 dos 15 índices nunca foram usados

`pg_stat_user_indexes.idx_scan`, com `stats_reset` a `NULL` (nunca reposto):

| Índices | Scans |
|---|---|
| `idx_user_sessions_user_id` | 15 |
| `idx_rate_limits_identifier` · `_window` · `_composite` | 9 · 4 · 2 — **todos meus**, dos probes de hoje; a tabela tem 0 linhas e 0 chamadores |
| Os outros **12** | **0** |

Os 12 a zero: os 3 de `user_profiles`, os 3 de `user_auth_providers`, 4 dos 5 de
`user_sessions` e o `idx_rate_limits_endpoint`. São 16 kB cada — o custo não é
espaço, é escrita: cada índice é mantido em cada `INSERT`/`UPDATE` da tabela.

**Ressalva, e é importante:** «0 scans» significa «nenhum desde que estas
estatísticas começaram». O `stats_reset` é `NULL` (nunca reposto à mão), mas uma
reposição por upgrade ou crash não deixa marca. Tratar como *forte indício*, não
como prova — e um índice que serve só um caminho raro (uma consulta de suporte,
um relatório) é legitimamente zero. **Proposta: TASK-25**, e a decisão é de
quem conhece os caminhos, não do contador.

---

## Método — onde escrever o teste de uma invariante de BD

Vale registar porque a resposta não é óbvia e custou meia sessão a decidir.

**O repo da app tem framework de testes:** Jest (`npm test`, `jest-expo`), com um
precedente de guarda de arquitectura em
`src/__tests__/architecture/subscriptionWriteBoundary.test.ts`, que lê ficheiros
do disco e falha quando alguém reintroduz um padrão proibido.

**Mas nenhum teste offline vê *grants* de Postgres.** Uma guarda estática sobre
as 121 migrações cobriria as políticas e ficaria **verde com os `EXECUTE`
abertos** — e não vê de todo o `ALTER DEFAULT PRIVILEGES`, que é onde o
re-grant realmente vive. Seria uma guarda a provar a coisa errada: exactamente a
classe de bug que este projeto já pagou duas vezes.

**A solução foi o idiom do próprio repo da app**, que já lá existia em
`database/migrations/test_*.sql`: **SQL, com blocos `DO $$` que `RAISE`**, a
correr como `anon` via `SET LOCAL ROLE` dentro de `BEGIN`/`ROLLBACK`. Sem key,
sem rede, re-corrível por qualquer pessoa no SQL Editor — o que um transcript de
shell num commit nunca é. Cada um falha antes nomeando cada via aberta e passa
depois: `test_122`, `test_123`, `test_124`, `test_125`.

Três regras que saíram da prática:

1. **Contar `undefined_table`/`undefined_function` como «fechado».** É o que fez o `test_122` sobreviver à `124`, que apagou o seu sujeito, em vez de ter de ser apagado com ele.
2. **Afirmar os grants *antes* de chamar qualquer coisa,** quando a função escreve. O `test_123` recusa-se a chamar as duas funções enquanto os grants estiverem de pé — provar a via exigiria correr uma escrita não autenticada em produção, e um script de verificação não faz isso sem que lhe peçam.
3. **Correr o ficheiro, não a versão retipeada.** Os quatro foram corridos verbatim no fim. O `test_124` tinha sido editado *depois* da corrida de RED (o cast `::text`, que o plpgsql exige contra um literal sem tipo) — um ficheiro de teste que nunca correu como está escrito não é um teste.

**E a lição que não é sobre testes.** O «O quê» da TASK-11 descrevia metade do
buraco: o `DROP POLICY` que ela pedia deixava de pé um RPC que qualquer pessoa
podia chamar para apagar a tabela. O discriminador que vale a pena aplicar à
task seguinte é — *a alteração que a task pede torna verdadeira a frase que a
task existe para tornar verdadeira?* Verificar a afirmação, não executar a
instrução.

## O que sai daqui

| | O quê | Estado |
|---|---|---|
| A | Políticas `TO public` | ✅ migration 122 |
| B | 3 de 4 funções sem travão, abertas a `anon` | ✅ migrations 122 e 123 |
| C | `search_path` mutável | TASK-22 — **autorizada**, 18 funções |
| D | A `001` não descreve a BD; `check_rate_limit` divergente e avariada | TASK-21 |
| E | `update_user_profile_secure` morta e avariada | **TASK-24** (nova) |
| F | 12 índices sem uso registado | **TASK-25** (nova) |

A `001` não precisa de ser reescrita: é história, e reescrevê-la não muda a BD.
O que precisa é que os defeitos vivos que ela deixou sejam fechados um a um — A
e B estão, C está autorizada, D/E/F ficam nomeados acima.
