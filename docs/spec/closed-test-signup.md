# Spec: Formulário de inscrição no teste fechado

> **Estado:** direção aprovada (2026-09-10), **por implementar**.
> Substitui a waitlist. Relacionado: [`docs/delete-account.md`](./delete-account.md).

## Objective

A waitlist deixa de fazer sentido: a app vai entrar em teste fechado no Google Play, e não há tempo nem razão para manter duas listas. O formulário existente da landing-page passa a **inscrever testers**.

**Restrição de partida:** não há ninguém na waitlist neste momento — o que torna a transição limpa. Se houvesse contactos confirmados, transformá-los em testers seria uma **finalidade nova** (limitação das finalidades, RGPD) e exigiria pedir consentimento novo por email, não reaproveitar o antigo.

> **Suspeita a confirmar:** a ausência de inscritos é provavelmente consequência de um bug, não de falta de interesse — a `TURNSTILE_SECRET_KEY` errada no Vercel partia o formulário da waitlist em produção, e só foi detetada a 2026-09-10. Vale a pena olhar para as datas antes de concluir seja o que for sobre procura.

## Como funciona o teste fechado do Google Play

A correção que mudou o desenho: **a Google não envia o convite.** O Play Console dá um **link de opt-in** (`https://play.google.com/apps/testing/<package>`) que é distribuído por nós.

**Usar um Grupo Google como lista de testers**, não uma lista de emails colada à mão:

| | Lista de emails | **Grupo Google** ✅ |
|---|---|---|
| Adicionar um tester | voltar ao Play Console, colar, guardar | adicionar membro ao grupo |
| Automatizável | não | sim (Directory API, se `eatease.eu` for Workspace) |
| Registo no Play Console | a cada alteração | **uma vez** |

Requisitos do lado do tester: o email tem de ser uma **conta Google**, e a adesão ao grupo tem de estar **ativa** (não pendente) antes de o link de opt-in funcionar.

**A verificar no Play Console:** contas de programador pessoais criadas depois de certa data precisam de um número mínimo de testers com opt-in contínuo durante um período antes de poderem candidatar-se a produção. Os números já mudaram mais do que uma vez — confirmar na política atual, não em memória.

## Fluxo

```
1. User preenche o formulário na landing-page
2. Double opt-in — inalterado (contacts.token, 48h)
3. User confirma
   ├─ Email para o operador:  "adicionar <email> ao Grupo Google"
   └─ Email para o user:      "recebemos; o convite chega em breve (máx. 24h)"
4. Operador adiciona o email no Google Play Console   ← passo manual
5. Operador envia o link de opt-in ao user           ← passo manual, TASK-F
6. User abre o link, aceita, instala da Play Store
```

> **Nota de 2026-09-10:** o passo 4 é feito **no Play Console**, não num Grupo Google — sem esse
> registo o utilizador não tem acesso à app. O Grupo Google (TASK-D) continua a ser a forma de
> gerir a lista, mas quem concede acesso é o Play Console.

**Porque o email do passo 3 não pode dizer «foste adicionado».** Nesse instante ainda não foi — o passo 4 é manual e vem depois. Um email que anuncia acesso que ainda não existe mente durante essa janela. Daí a formulação «recebemos, o convite chega em breve».

**Quando o passo 4 for automatizado** (Directory API), os passos 3–5 colapsam: o email de confirmação passa a levar o link de opt-in diretamente e o trabalho manual desaparece.

## Schema

> **Revisto a 2026-09-10 (TASK-F).** A previsão de «nenhuma alteração» não sobreviveu ao envio dos convites — ver a migração `0003`.

Duas colunas novas em `contacts`:

| Coluna | Porquê |
|---|---|
| `source` — `'form'` \| `'manual'` | Há testers que chegaram por outra via e nunca clicaram num token. Ficam `confirmed = true` porque o consentimento existe; sem esta coluna a flag afirmaria um clique que não houve, e sem rasto de que não houve. |
| `closed_test_invited_at` — `timestamptz NULL` | Chave de idempotência do envio: um convite por pessoa, e uma execução que morre a meio retoma em vez de reenviar a todos. |

**O que a segunda coluna não regista:** *acesso concedido*. Quem concede é o passo 4 — o registo no Play Console —, que continua manual e separado. Nada impede mandar o link a quem ainda não está registado; para essa pessoa o link simplesmente não funciona. Com um operador e uma dúzia de testers não vale um segundo timestamp: basta manter «adicionar lote à Consola» e «correr o script» juntos.

**O CSV sai — mas ainda não saiu.** `closed_test_contacts.csv` guarda nome e email de 13 pessoas: dados pessoais fora do alcance do `/delete-account`. A mesma razão que obriga `contacts` a ter caminho de eliminação obriga-as a estar lá dentro. `scripts/import-closed-test-contacts.mjs` faz a importação e fica no repo para ela ser reproduzível — **por correr à data desta escrita** (só o `--dry-run` foi verificado, 13 a inserir + 1 já existente). Apagar o ficheiro **depois** de a importação passar.

Isto importa para a página de eliminação: `contacts` continua a guardar nome e email sob a responsabilidade do mesmo responsável pelo tratamento, logo continua a precisar do seu caminho de eliminação — seja waitlist ou lista de testers.

## Tasks

### TASK-A: Copy do formulário e da secção CTA
- **Ficheiros:** `src/lib/i18n/locales/{10}/form.ts`, `cta.ts`
- **O quê:** de «entra na lista de espera» para «inscreve-te no teste fechado». Deixar claro que (a) é preciso uma **conta Google**, (b) o acesso chega por email, (c) é uma versão de teste.
- **Constraint:** as 10 locales na mesma task — `Translations = typeof en` faz o `tsc` falhar até todas terem as chaves.
- **Status:** [ ] TODO

### TASK-B: Email ao operador na confirmação
- **Ficheiros:** `src/app/api/contacts/confirm/route.ts`
- **O quê:** ao confirmar, enviar ao operador um email com o endereço a adicionar ao grupo. Hoje o `confirm` só envia o email de boas-vindas ao utilizador.
- **Porquê na confirmação e não na submissão:** garante que **todos os emails recebidos são acionáveis** — sem ruído de inscrições abandonadas ou maliciosas.
- **⚠️ Correção à descrição acima:** o `confirm` **já envia** um email ao operador (`route.ts:63-82` → `src/templates/new-user-confirmation.html` → `RESEND_WELCOME_EMAIL`). A task é **reescrever** esse email, não acrescentar outro — implementada como está descrita, o operador passa a receber dois por inscrição.
- **Herda o tratamento da TASK-17/TASK-18, e aqui é mais grave:** o `Promise.all` de `route.ts:70-83` não inspecciona `{ error }` e **não rejeita**. A rota grava `confirmed = true` (`:41-44`) e redirecciona para `/confirmed` mesmo que nenhum dos dois emails saia; o segundo clique cai no early-return de `:30-32` e **não reenvia** — a inscrição do tester perde-se em definitivo. Tem de passar a `getResend()` + `{ error }`, com o email do operador tratado como o que tem de suceder, e uma via de reenvio para quem ficou `confirmed` sem ter sido adicionado ao grupo.
- **Status:** [ ] TODO

### TASK-C: Copy do email de boas-vindas
- **Ficheiros:** `src/lib/i18n/locales/{10}/emails.ts`, `src/templates/welcome-email.html`
- **O quê:** de «avisamos-te no lançamento» para «recebemos a tua inscrição; o convite para o teste chega em 24h». **Não** afirmar que o acesso já está concedido.
- **Status:** [ ] TODO

### TASK-17: Endurecer `/api/contacts` e mostrar o código no formulário
- **Status:** [x] COMPLETE — a rota que este spec vai reescrever não tinha nenhuma das protecções que a TASK-12 trouxe à `/api/account-deletion`. Agora tem:
  - verificação de configuração antes de tudo → `CONFIG_MISSING_RESEND` (via `getResend()`, para o check ser alcançável);
  - `checkRateLimit` e o upsert em `try/catch` → `DB_UNAVAILABLE` (Supabase frio);
  - `{ error }` no envio → `MAIL_FAILED:<nome>`, **em vez de 201 com o email por enviar**;
  - códigos estáveis em todas as respostas: `RATE_LIMITED`, `INVALID_DATA`, `ALREADY_REGISTERED`, `COOLDOWN_ACTIVE`, `CAPTCHA_FAILED:<código CF>`.
- **`ContactForm`:** passou a mostrar o código do servidor (já era devolvido e era deitado fora em `route.ts:48` — é a razão de o `invalid-input-secret` ter levado duas sessões a encontrar). Ganhou também `role="alert"`, que não tinha: os erros nunca eram anunciados a leitores de ecrã. `COOLDOWN_ACTIVE` deixa de ser confundido com rate limiting genérico.
- **Guardado por:** `src/app/api/contacts/route.test.ts` (9) + `src/components/ContactForm.test.tsx` (7).

### TASK-F: Envio do convite de teste fechado (o passo manual)
- **Ficheiros:** `src/templates/google-play-console-link.html` (**já existe**, escrito pelo utilizador a 2026-09-10), `src/lib/i18n/locales/{10}/emails.ts` → `closedTestInvite`
- **O quê:** depois de o operador registar o email no Play Console, envia-se por Resend o email que leva o **link de opt-in**. É o passo 5 do fluxo, e é o que dá acesso efetivo à app.
- **Contrato do template** — 16 placeholders, e a origem de cada um:

  | Placeholder | Origem |
  |---|---|
  | `subject`, `greeting`, `intro`, `instructions_title`, `step_1`, `step_2`, `cta_label`, `fallback_note`, `feedback_note`, `sign_off` | `dict.emails.closedTestInvite` (`greeting` usa `{name}`) |
  | `team` | `dict.emails.teamName` |
  | `site_url` | `NEXT_PUBLIC_SITE_URL` |
  | **`play_store_url`** | **sem origem definida** — é o link de opt-in `https://play.google.com/apps/testing/<package>` que sai da TASK-D. Precisa de variável própria (proposta: `CLOSED_TEST_OPT_IN_URL`), e tem de ser documentada no `CLAUDE.md`. |

- **Decidido:** **script `node` corrido à mão** (`scripts/send-closed-test-invite.mjs`). Descartado o route handler — evita a entrada em `outputFileTracingIncludes` (`next.config.ts`) sem a qual o template não vai no bundle e falha **só em produção**, e evita expor um endpoint de envio em massa que só o operador usaria.
- **Os links passaram a ser dois, por ordem** (2026-09-10, depois de o Ricardo testar na Consola):
  1. `play_store_url` ← **`CLOSED_TEST_OPT_IN_URL`** — *Adesão na web*, `https://play.google.com/apps/testing/<package>`. É **este** que regista a adesão e faz o testador contar.
  2. `download_url` ← **`CLOSED_TEST_DOWNLOAD_URL`** — *Adesão Android*, a ficha da loja. Só resolve para quem já aderiu.
- **O erro que isto evita:** mandar só a ficha da loja. Quem clica sem ter aderido recebe «item não encontrado», e quem instalar por essa via **não é contabilizado** — foi exatamente o que pôs a Consola a «0 testadores atualmente a participar» com a app instalada. O `downloadNote` diz a ordem em texto, para o caso de alguém carregar no segundo botão primeiro.
- **Remetente próprio: `CLOSED_TEST_FROM_EMAIL`.** Este email pede resposta («basta responderes a este email»), e o `RESEND_FROM_EMAIL` das rotas é um no-reply — pedir resposta a partir de uma caixa que não lê é uma afirmação falsa, da mesma família das que este spec já proíbe.
- **Buraco de tipos fechado (2026-09-10).** `ctaDownload` e `downloadNote` foram acrescentados ao bloco `welcome` em vez de `closedTestInvite`, o `tsc` passou a zero e o email real renderizou a string `undefined` em três sítios. A causa: `LocaleEmails` é um tipo escrito à mão e os dicionários chegam ao script por `import()` dinâmico de um `.mjs`, sem tipo — nada comparava os dois. Guardado agora por `src/lib/closedTestInvite.locales.test.ts`, que renderiza o convite nas 10 locales e falha se sobrar `{{` ou aparecer `undefined`. **Verificado que falha** removendo a chave a uma locale.
- Nenhum dos dois é derivado do outro: ambos são copiados da Consola. Uma derivação do tipo «tira o package do link A e monta o link B» fica silenciosamente errada no dia em que a Google mudar a forma.
- **Herdou o tratamento da TASK-17/TASK-18**, e foi aqui que apareceu a forma mais perigosa: `resend.emails.send()` resolve `{ data, error }` em vez de rejeitar, portanto marcar `closed_test_invited_at` num envio falhado esconderia essa pessoa de **todas** as execuções seguintes, em silêncio. A marcação corre só depois de um resultado limpo, por contacto, imediatamente.
- **Também corrigido:** o fallback de locale deixou de ser mudo (um tester alemão podia receber português sem nada no log), o nome passa a ser escapado no HTML, e `RESEND_FROM_EMAIL` deixou de ter fallback adivinhado — os dois scripts anteriores discordavam entre `noreply@` e `no_reply@`.
- **Onde vive a lógica:** `src/lib/closedTestInvite.ts`, pura e com dependências injectadas, para ser testável; o `.mjs` só liga Postgres, Resend e o ambiente. Guardado por `src/lib/closedTestInvite.test.ts` (13).
- **Depende de:** TASK-D — o link. **É a única coisa que falta** para correr o envio.
- **Status:** [x] COMPLETE (código); a correr depende do link da TASK-D

### TASK-D: Play Console — Grupo Google
- **O quê:** criar o grupo (ex.: `testers@eatease.eu`), registá-lo como lista de teste fechado, guardar o link de opt-in.
- **Status:** [ ] TODO — **requer acesso ao Play Console (utilizador)**

### TASK-E (futuro): automatizar a adição ao grupo
- **O quê:** Directory API a partir do handler de confirmação; o email passa a levar o link de opt-in e o passo manual desaparece.
- **Depende de:** `eatease.eu` em Google Workspace + service account com delegação.
- **Status:** [ ] TODO — otimização, não bloqueia nada

## Nota de i18n — a *Constraint dura* durante edições em paralelo

`emails.closedTestInvite` (TASK-F) está **completo nas 10 locales** desde 2026-09-10.

Fica o padrão registado, porque volta a acontecer: `Translations = typeof en`, portanto acrescentar
uma chave a `en` faz o `tsc` falhar nas outras nove até todas a terem. Com o Ricardo a editar o repo
em paralelo com as sessões, essa janela aparece **a meio de um rollout** — não é um erro de ninguém,
é o tipo a funcionar. Duas armadilhas:

- **O `npm test` fica verde na mesma.** O Vitest não faz type-check e em runtime só `en` é carregado.
  Uma suite verde não prova que o `build` passa — correr `npx tsc --noEmit` sempre à parte.
- **O estado muda debaixo dos pés.** Verificar imediatamente antes de dar uma task por concluída,
  não no início da sessão.

Estado corrente e comandos de verificação em [`NEXT.md`](./NEXT.md).

## Boundaries

- **Nunca** afirmar num email que o acesso está concedido antes de o estar.
- **Nunca** reaproveitar consentimento de waitlist para inscrição em teste sem pedir de novo (não se aplica hoje — lista vazia).
- **Sempre** as 10 locales na mesma task.

## Open Questions

1. **Nome e endereço do Grupo Google** — `testers@eatease.eu`?
2. **Emails que não são contas Google** — detetar e avisar no formulário, ou deixar falhar no opt-in? Avisar é mais gentil, mas não há forma fiável de o validar a partir do endereço.
3. **Limite de testers** — o teste fechado tem um teto; vale a pena fechar as inscrições ao atingi-lo, ou gerir manualmente?
