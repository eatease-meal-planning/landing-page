# Estado e próximo passo

> Ponto de partida de cada sessão. Atualizado a **2026-09-12**.
> Specs: [`closed-test-signup.md`](./closed-test-signup.md) · [`delete-account.md`](./delete-account.md)
> Revisões: [`spec-review.md`](./spec-review.md) · [`audit-migration-001.md`](./audit-migration-001.md)

## Estado do `tsc` — verificar sempre ao começar

**`closedTestInvite`: concluído.** As 10 locales têm as 10 chaves (`subject`, `greeting` com `{name}`, `intro`, `instructionsTitle`, `step1`, `step2`, `cta`, `fallbackNote`, `feedbackNote`, `signOff`). ✅

**`emails.privacyPolicy`: concluído.** As 10 locales têm a chave. ✅ (Estava dado como em falta em 6 — o Ricardo terminou o rollout entretanto. Serve de exemplo do aviso abaixo.)

**Nenhuma chave de i18n em curso.** `npx tsc --noEmit` dá 0 erros.

### A armadilha a conhecer

`Translations = typeof en`. Acrescentar uma chave a `en/*.ts` parte o `tsc` nas outras nove até todas a terem — é a *Constraint dura* dos specs, e durante uma edição em paralelo ela aparece **a meio**, sem que ninguém tenha feito nada de errado.

Duas consequências práticas:

1. **`npm test` continua verde durante essa janela** (180/180). O Vitest não faz type-check e em runtime só `en` é carregado. **Uma suite verde não prova que o build passa.** Correr sempre `npx tsc --noEmit` à parte.
2. **O estado muda debaixo dos pés.** Nesta sessão o `tsc` deu 0 erros numa passagem e falhou na seguinte, porque um ficheiro foi gravado entretanto. Verificar imediatamente antes de concluir seja o que for.

Comando genérico, serve para qualquer chave nova:

```bash
npx tsc --noEmit 2>&1 | grep -oE "Property '[a-zA-Z]+' is missing" | sort -u
for l in de en es fr it nl pl pt-pt ro sv; do
  printf "%-6s " "$l"; grep -q "<chave>" src/lib/i18n/locales/$l/emails.ts && echo ok || echo FALTA
done
```

---

## Feito nesta sessão

| Task | O quê | Guardado por |
|---|---|---|
| **TASK-19** (repo `app`) | A app prometia «all your data» e «the **single** exception» no ecrã onde a decisão é tomada. São **três**. As 10 locales passam a declará-las. O **`pt` era o pior e não o melhor**: não dizia «uma única excepção» porque não dizia excepção nenhuma — não tinha a frase do identificador técnico em nenhuma das duas strings. Foi acrescentada por inteiro, não corrigida. | `check-i18n` completo · `type-check` 0 · **4151 testes / 208 suites** no repo da app |
| **TASK-22** (repo `app`) | `search_path` pinado: **25/25** funções de `public` (eram 10/25). **Não se usou `search_path = ''`**, que era o aprovado — `''` obriga a qualificar cada referência, e a `update_updated_at_column` serve 10 triggers e a `handle_new_user` serve o registo de conta. Usou-se `public, pg_temp`, que é a convenção do projeto **e** mais seguro: se `pg_temp` não for listado, o Postgres procura-o *primeiro*. | `test_125` + `UPDATE` revertido em 6 tabelas reais + o `23503`-vs-`42P01` do `handle_new_user` |
| **TASK-20/21** (repo `app`) | A superfície de rate limiting apagada — 0 linhas, 0 chamadores, 0 crons, 0 dependências. A TASK-21 resolveu-se por eliminação: o `check_rate_limit` vivo recusava o primeiro pedido de cada identificador e nunca registou uma linha. | `test_124` + o `test_122` a continuar 4/4 **depois** de o seu objecto desaparecer |
| **Auditoria da `001`** | Pedida depois de três defeitos da mesma origem. Achado estruturante: **a `001` já não descreve esta BD** — 7 das 20 colunas que escreve não existem, e duas das quatro funções foram substituídas sem migration. Saíram três tasks novas. | [`audit-migration-001.md`](./audit-migration-001.md) |
| **TASK-23** (repo `app`) | `cleanup_expired_sessions()` e `migrate_existing_user_profiles()` executáveis por `anon`, sem verificação de quem chama, sobre tabelas com linhas. A segunda devolvia **UUIDs de utilizadores reais**. | `test_123` + antes/depois do PostgREST |
| **TASK-11** (`delete-account`, repo `app`) | `rate_limits` estava aberta a `anon`. **E o `DROP POLICY` que a task pedia não a fechava:** duas das seis vias de acesso nunca consultam RLS — as duas funções são `SECURITY DEFINER` de `postgres`, que tem `rolbypassrls`, e tinham `EXECUTE` concedido a `anon`; e `cleanup_expired_rate_limits()` apaga tudo o que tem mais de uma hora, portanto **`EXECUTE` nela é `DELETE` na tabela**. Mais: o RLS só é consultado depois de o teste de privilégio da tabela passar, e `anon` tinha o `arwdDxt` completo — era isso que fazia o PostgREST responder `200`/`204` e não «permission denied». A migration `122` faz as três coisas e revoga **pelo nome**, não só de `PUBLIC` (lição da `094`). Aplicada a 2026-09-11. | `app/database/migrations/test_122_rate_limits_locked.sql` (4 asserções, 6 probes) + antes/depois do PostgREST |
| **TASK-16** (atravessa os dois specs) | A eliminação não alcançava a lista de testers do Play Console, e o atalho dentro da app apresentava-se como o caminho rápido sendo o incompleto: a edge function da app apaga auth e storage no projeto **dela**, que não vê o `contacts` da landing-page nem o Console. Quem eliminava por lá continuava tester. O email ao operador ganhou o passo 3, e o `inApp.body` das 10 locales passou a dizê-lo. | 20 asserções em `deleteAccountCopy.test.ts` + 1 em `account-deletion/route.test.ts` |
| **TASK-A1/A2/A3 + C** (`closed-test-signup`) | O formulário deixou de abrir uma lista de espera. `nav`/`cta`/`form`/`hero`/`pages` nas 10 locales, `joinWaitlist` → `joinClosedTest`, e os dois documentos legais (2 ficheiros, não 20 — só o `en` os tem) passam a declarar a inscrição no teste fechado **e a partilha do endereço com a Google**. O par da App Store fica em «brevemente», e há um teste que o exige: não há TestFlight. | `src/lib/i18n/closedTestCopy.test.ts` (60) |
| **TASK-B** (`closed-test-signup`) | Perda de dados no `confirm`: gravava `confirmed = true` **antes** dos envios, num `Promise.all` sem `{ error }`, e o segundo clique não reenviava — um tester que confirmasse durante uma falha da Resend perdia-se em silêncio. A ordem inverteu-se: operador primeiro, marcar depois. Mais `getResend()`, `SIGNUP_NOTIFICATION_TO_EMAIL`, e o código do erro visível na página. | `src/app/api/contacts/confirm/route.test.ts` (11) |
| **TASK-15** (`delete-account`) | A instrução de contestação. As 9 locales não-`pt-pt` diziam na página que ignorar o email bastava — e o pedido já está na caixa do operador quando alguém a lê. `pt-pt` estava ao contrário (email a mandar ignorar, página sem a frase e a prometer uma confirmação que a Fase 1 não tem). As 20 strings passam a «responder para cancelar», e `pt-pt` volta ao prazo dos 30 dias nas duas superfícies. **Além disso:** o email de acknowledgement não tinha `replyTo` — mandava responder para o `RESEND_FROM_EMAIL`, que é um no-reply. Passou a `replyTo: operator`, senão a frase nova era tão falsa como a que substituiu. | `src/lib/i18n/deleteAccountCopy.test.ts` (30) + `ptPtRegister.test.ts` (3) + 1 em `account-deletion/route.test.ts` |
| **TASK-F** (`closed-test-signup`) | O envio do convite passou a sair da BD, não de um CSV. Duas colunas novas (`source`, `closed_test_invited_at`, migração `0003` **já aplicada à BD**), script de importação do CSV escrito e verificado em `--dry-run` (**por correr a sério**), e os dois scripts anteriores fundidos num. O antigo `send-closed-test-invite.mjs` **nunca tinha corrido**: `t` e `team` não estavam definidos (`ReferenceError` na linha 154, mesmo em `--dry-run`). | `src/lib/closedTestInvite.test.ts` (14) + `closedTestInvite.locales.test.ts` (10) |
| **TASK-18** (`delete-account`) | `OPERATOR_MAIL_FAILED` era inalcançável — `resend.emails.send()` **não rejeita**, resolve `{ data, error }`. A rota respondia 202 «pedido recebido» com a caixa do operador vazia. Passou a inspecionar `{ error }` → `OPERATOR_MAIL_FAILED:<nome>` (502). | `src/app/api/account-deletion/route.test.ts` (7) |
| **TASK-17** (`closed-test-signup`) | `/api/contacts` ganhou verificação de configuração, `try/catch` nos dois caminhos de BD, `{ error }` no envio, e códigos estáveis em todas as respostas. O `ContactForm` mostra o código (já era devolvido e era deitado fora) e ganhou `role="alert"`, que não tinha. | `src/app/api/contacts/route.test.ts` (11) + `src/components/ContactForm.test.tsx` (7) |
| — | `getResend()` (`src/lib/resend.ts`): `new Resend(undefined)` **lança**, portanto construí-lo em module scope matava a rota no import e o `CONFIG_MISSING_RESEND` nunca corria. | `src/lib/resend.test.ts` (5) |
| — | Extraídos `fail()` → `src/lib/apiError.ts` e `escapeHtml` → exportado de `src/lib/email.ts`. | — |

**Framework de testes:** Vitest 5 + jsdom + Testing Library, `npm test` (180 testes, 10 ficheiros). Decisão revertida face aos specs, que o punham fora de scope — a §2.4 da revisão mostrou que a classe de bug que custou duas sessões não é apanhável por `tsc`/`lint`/`build`.

Duas notas de instalação, para não se repetir a investigação: `@vitejs/plugin-react` foi **descartado** (puxa Babel 8 e colide com `babel-plugin-react-compiler`, que está em Babel 7 — o esbuild do Vitest transforma TSX sem ele); e `@types/node` subiu de `^20` para `^24`, exigência do Vitest 5 e alinhado com o Node 24 em uso.

---

## Ordem a seguir

```
0. ✅ emails.privacyPolicy
1. ✅ TASK-F   envio do convite de teste fechado
2. ✅ TASK-D   Play Console — lista de emails, testers a aderir
3. ✅ TASK-15  «ignorar» → «responder» nas 10 locales
4. ✅ TASK-A1/A2/A3 + C + B   (B saiu em commit próprio: era perda de dados, não copy)
5. ✅ TASK-16  a eliminação alcança a lista de testers
6. ✅ TASK-11  fechar rate_limits ao anon              (migration 122)
7. ✅ TASK-23  as duas SECURITY DEFINER sem travão    (migration 123)
8. ✅ Auditoria da 001                                 (audit-migration-001.md)
9. ✅ TASK-20/21  apagar a rate_limits morta           (migration 124)
10. ✅ TASK-22  pinar o search_path                    (migration 125)
11. ✅ TASK-19  a app já declara as três excepções     (10 locales)

    ── a autorização de 2026-09-11 no repo `app` acaba aqui ──

12. Fase 2:  TASK-09 · 03 · 04 · 05 · 13 · 14   ← A SEGUIR, e é tudo nesta árvore
    TASK-24/25/26  achados da auditoria, «perguntar primeiro» (`delete-account.md`)
    TASK-E   ✗ impossível — sem Grupo Google não há API
```

## Para arrancar o teste fechado

```bash
node scripts/import-closed-test-contacts.mjs --dry-run   # confere as 13 linhas
node scripts/import-closed-test-contacts.mjs             # CSV -> contacts (uma vez)
# ... registar os emails no Play Console, guardar o link de opt-in ...
# no .env.local, os DOIS links de "Como os testadores participam no seu teste":
#   CLOSED_TEST_OPT_IN_URL=https://play.google.com/apps/testing/<package>        (Adesao na web)
#   CLOSED_TEST_DOWNLOAD_URL=https://play.google.com/store/apps/details?id=<pkg>  (Adesao Android)
#   CLOSED_TEST_FROM_EMAIL=ricardo.rato@eatease.eu   (caixa real: o email pede resposta)
node scripts/send-closed-test-invite.mjs --dry-run       # quem receberia
node scripts/send-closed-test-invite.mjs                 # envia e marca
```

**A ordem importa, duas vezes.** Sem a importação, o envio encontra menos contactos do que julgas. E dentro do email, o link de **adesão na web** vem primeiro: a ficha da loja só resolve depois da adesão, e instalar por ela **não conta** para o requisito dos 12 testadores.

Reentrante: quem falhar fica com `closed_test_invited_at` a NULL e entra na execução seguinte. Quem se inscrever pelo formulário a partir daqui aparece sozinho na próxima passagem — não é preciso tocar em ficheiro nenhum.

### A TASK-11 está fechada — o que ela ensinou

O repo da app **tem** framework de testes: **Jest** (`npm test`, `jest-expo`), com um
precedente de guarda de arquitectura em
`src/__tests__/architecture/subscriptionWriteBoundary.test.ts`. Mas nenhum teste
offline vê *grants* de Postgres, e uma guarda estática sobre as 121 migrações
cobriria as políticas e ficaria verde com os `EXECUTE` abertos — seria uma
guarda a provar a coisa errada, exactamente a classe de bug que este projeto já
pagou duas vezes. O teste foi escrito no idiom do próprio repo da app
(`database/migrations/test_*.sql`, que já lá existia): **SQL, com `DO $$` que
`RAISE`**, sem key e sem rede, a correr como `anon` via `SET LOCAL ROLE` dentro
de `BEGIN`/`ROLLBACK`. Falha antes nomeando cada via aberta, passa depois.

**A lição transferível:** o «O quê» da task descrevia metade do buraco. O
discriminador que vale a pena aplicar à próxima é — *a alteração que a task pede
torna verdadeira a frase que a task existe para tornar verdadeira?* Aqui não: o
`DROP POLICY` deixava de pé um `RPC` que qualquer pessoa podia chamar para
apagar a tabela. Verificar a afirmação, não executar a instrução.

---

### TASK-19 está fechada — e o `pt` era o caso pior

A app dizia «all your data» e «the **single** exception» em Definições → Mais,
no ecrã onde a decisão é tomada. São três: o hash do trial, a linha em
`contacts` e o endereço na lista de testers. As 10 locales passam a declarar as
três, e a mencionar `eatease.eu/delete-account` para as duas que a app não
alcança — sem prefixo de locale, porque o middleware redireciona um caminho nu
para `/{locale}{path}`.

**O `pt` não estava a exagerar por uma, estava a exagerar por três.** Não dizia
«uma única excepção» porque não tinha a frase do identificador técnico em
nenhuma das duas strings — afirmava «todos os teus dados» sem ressalva
nenhuma. É a TASK-15 outra vez: a locale que parece estar alinhada com as
outras é a que está pior, e só se vê lendo as dez.

**Não se acrescentou link nem código.** Um `getDeleteAccountUrl()` em
`src/config/links.ts`, no molde do `getPrivacyPolicyUrl()` que já lá está,
seria a coisa certa a fazer um dia — mas esta task era de copy, e a
autorização era dessa.

---

### Depois: a Fase 2 (`delete-account`)

`TASK-09 · 03 · 04 · 05 · 13 · 14`. Duas coisas que a TASK-16 deixou lá dentro e que é fácil perder de vista:

- **A TASK-13 herdou dois avisos obrigatórios no passo 3**, ambos pela mesma razão — a eliminação self-service é *imediata* mas não é *completa*: a oposição ao registo de trial (art. 21.º) tem de ser pedida **antes**, e a remoção da lista de testers do Play Console é manual, porque não há API que lá chegue.
- **A TASK-19 fixou a formulação das três excepções** (hash do trial, linha em `contacts`, endereço na lista de testers) em 10 locales do repo `app`. A copy da Fase 2 alinha-se com essa, em vez de inventar uma quarta versão da mesma verdade — já houve três (landing-page `inApp.body`, app `confirmMessage`, app `pt` a não dizer nada) e cada divergência custou uma task.
- **A §4.1 bloqueia a TASK-13** até o `DeleteAccountSection.tsx` ser partido em `useAccountDeletion()` + `<StepEmail>`/`<StepCode>`/`<StepConfirm>`. A ordem obrigatória `contacts` → `delete-account` tem de ficar numa função nomeada, não enterrada num `handleSubmit` de 500 linhas.

---

### Fica em aberto (não bloqueia nada)

**Variáveis de ambiente.** O `RESEND_WELCOME_EMAIL` faltava na Vercel e foi acrescentado a 2026-09-10, com redeploy — é uma caixa real, que o Ricardo lê, e é dela que sai o email a avisar que o endereço foi acrescentado ao Play Console. O `SIGNUP_NOTIFICATION_TO_EMAIL` continua por definir e o fallback aponta para ela, o que é seguro; defini-lo só serve para as duas coisas (remetente do email ao visitante, destinatário da notificação ao operador) deixarem de estar presas à mesma variável.

O `replyTo` do acknowledgement da eliminação é o `DELETION_REQUEST_TO_EMAIL` — correcto em qualquer cenário, porque essa caixa é lida por definição.

O registo do `pt-pt` foi uniformizado em «tu» (decisão do Ricardo: o tom é o da app). O `deleteAccount.ts` era o único ficheiro em «você»; corrigidos também `aboutUs.value1` («por lhe poupar tempo») e `pages.linkExpired` («submete o seu email»), onde a divisão atravessava uma frase. Guardado por `ptPtRegister.test.ts`.

**A tradução em falta, que é a coisa maior desta lista:** o `pt-pt` não tem tradução dos três documentos legais — o `locales/pt-pt/index.ts` re-exporta os objectos do `en` (`privacyPolicy`, `termsOfUse`, `cookiePolicy`). Quem visita o site em português lê-os em inglês. O teste detecta-o por identidade de objecto e salta-os; no dia em que forem traduzidos, passam a ser verificados sozinhos. As outras oito locales estão na mesma situação — nove sites a servir documentos legais em inglês.

---

## Portão de verificação (Boundaries dos specs)

```bash
npm test            # 180 testes
npx tsc --noEmit    # 0 erros exigidos
npm run lint        # 0 erros (2 warnings pré-existentes, não introduzidos aqui)
npm run build
```

> O servidor de dev é corrido pelo utilizador num terminal próprio — **não arrancar `npm run dev`**.

---

## Estado do git

**Quase tudo desta sessão vive no repo `app`, não aqui.** Seis commits, um por
task, por ordem de aplicação:

```
eb3b87e9 fix(db):   fecha a tabela rate_limits a role anon              (122)
9488b281 docs(db):  precisao nos comentarios da 122
dfa3d380 fix(db):   fecha ao anon as duas SECURITY DEFINER sem travao   (123)
08ca9070 arch(db):  apaga a superficie de rate limiting sem chamador    (124)
42edd555 fix(db):   pina o search_path nas 15 funcoes                   (125)
ffdcb747 fix(i18n): o ecra de eliminacao declara tres excepcoes         (10 locales)
```

Migrations aplicadas a produção: `20260911100930` (122), `123`, `124`,
`125a` (o probe de uma função só) e `125`.

**O `.gitignore` do repo da app está modificado e ficou de fora de propósito, em
todos os seis commits** — é trabalho em paralelo do Ricardo (reverte o
`closed_test_contacts.csv` do commit `2f3c1abf`), não desta sessão. Continua por
commitar, e é dele.

Nesta árvore **não mexeu código nenhum**: os 180 testes e o `tsc` a 0 erros
foram reconfirmados depois das migrations, sem alteração. O que muda aqui é só
documentação. No repo da app, os portões que importavam para a TASK-19:
`check-i18n` completo, `type-check` a 0, **4151 testes em 208 suites**. O
`npm run lint` de lá tem 57 erros de `prettier`, **todos pré-existentes e todos
em `.ts`** — o script é `eslint . --ext .ts,.tsx` e portanto nunca leu o JSON
que a TASK-19 alterou.

Histórico anterior desta árvore, separado por task, por ordem:

```
2dc5c57 feat: framework de testes (Vitest 5 + jsdom + Testing Library)
6895af4 fix: /api/contacts falha ruidosamente, com código na resposta e no ecrã
3de7313 fix: OPERATOR_MAIL_FAILED era inalcançável na página de eliminação
b145508 feat: convite do teste fechado sai da BD, não de um CSV
3424538 fix: nenhuma locale manda ignorar o email de eliminação
89eb8c5 docs: specs passam para docs/spec/ e registam o estado da sessão
83cdc6e docs: estado após a TASK-15 e o registo do pt-pt
ffe007a fix: confirmar só depois de o operador saber, e mostrar o código do erro
b699b00 feat: o formulário inscreve testers, não uma lista de espera
7f829ba fix: o subtítulo do formulário descreve o botão, não o resultado final
90c9956 fix: a eliminação alcança a lista de testers, e o atalho da app diz que não
```

**Convenção, a partir daqui:** cada task implementada e testada leva um
commit próprio, com `feat:` / `arch:` / `fix:` e uma descrição breve.
