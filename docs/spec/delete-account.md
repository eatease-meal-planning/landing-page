# Spec: Página pública de eliminação de conta

> **Fase 1 — EM PRODUÇÃO** desde 2026-08-31. `https://www.eatease.eu/delete-account`, 10 locales, verificada ponta-a-ponta a 2026-09-10.
> **Fase 2 — EM PRODUÇÃO** desde 2026-09-14. Self-service por OTP, verificada ponta-a-ponta com uma conta real: a conta desapareceu na app e em `contacts`.
> Direção em [`docs/ideas/account-deletion-page.md`](./ideas/account-deletion-page.md) · Repos: `landing-page` (principal) · `app` (1 migration isolada, TASK-11)

## Objective

Dar a um utilizador — possivelmente já sem a app instalada — um URL público onde prove que é ele e elimine a conta e os dados associados, satisfazendo o requisito do Google Play Console (*«Adicione um link que os utilizadores podem usar para pedir a eliminação da respetiva conta e dos dados associados»*) e o direito ao apagamento do RGPD (Art. 17.º).

**User stories:**
- Como utilizador que desinstalou a app, abro o link da ficha do Play Store e elimino a conta sem reinstalar nada.
- Como utilizador que ainda tem a app, vejo na página que também o posso fazer em Definições → Mais.
- Como utilizador que perdeu o acesso ao email da conta, tenho um caminho humano.
- Como revisor do Google, abro o URL sem login e vejo que dados são apagados, quais ficam e em quanto tempo.

## Estado atual (verificado em produção)

| Verificação | Resultado |
|---|---|
| `curl -I -H 'Accept-Language: de' .../delete-account` | **307 → `/de/delete-account`** ✅ |
| Página `/en/delete-account` | **200**, conteúdo completo ✅ |
| Formulário ponta-a-ponta | ✅ chegam os dois emails (operador + requerente) |
| `/api/contacts` (waitlist) | ✅ reposto pela mesma correção |

**Duas falhas encontradas e corrigidas durante a verificação**, ambas invisíveis em `build`/`tsc`:

1. **Supabase frio.** O projeto adormece; a primeira query falhava e o handler devolvia **500 de corpo vazio**. Hoje devolve `DB_UNAVAILABLE` e regista a causa.
2. **`TURNSTILE_SECRET_KEY` errada no Vercel** — não pertencia ao widget da site key `0x4AAAAAADko69JejGfhKk6v`. A Cloudflare devolvia `invalid-input-secret`, que era engolido. **Partia também o formulário da waitlist** — explicação bem mais provável para não haver ninguém inscrito do que falta de interesse.

Lição registada nas *Boundaries*: nesta página, uma falha silenciosa é pior do que uma falha ruidosa. Toda a resposta de erro carrega um código estável (`DB_UNAVAILABLE`, `CAPTCHA_FAILED:<código da Cloudflare>`, `CONFIG_MISSING_OPERATOR`, `OPERATOR_MAIL_FAILED`, `RATE_LIMITED`) e a página mostra-o.

## Divergência de copy — resolvida pela TASK-15 a 2026-09-10

**Já não há divergência.** Fica registada porque a forma do bug voltou duas vezes
depois (TASK-16 e TASK-19) e é a mais cara deste projeto.

Era assim: a `pt-pt` tinha sido editada para descrever um fluxo com confirmação
que **não existia**, e as outras nove diziam na *página* que ignorar o email
bastava — quando o pedido já está na caixa do operador no momento em que alguém
lê a frase.

| | `pt-pt` (editada) | outras 9 |
|---|---|---|
| Prazo na página | «apenas após a confirmação» ❌ | «no prazo de 30 dias» ✅ |
| Email `ignore` | «basta ignorares e nada acontecerá» ❌ | «responde e nós cancelamos» ✅ |
| Página `successBody` | não tinha a frase | «ignore the email and nothing will happen» ❌ |

**O ponto que importa:** não havia passo de confirmação. Num pedido malicioso
contra terceiro, a vítima seguiria a instrução de ignorar e o pedido continuaria
na caixa do operador. As 20 strings passaram a «responder para cancelar» e a
`pt-pt` voltou ao prazo dos 30 dias nas duas superfícies. Ver a TASK-15.

**O que continua em pé:** quando a Fase 2 for publicada, as 10 locales passam a
«imediato após confirmação» **no mesmo commit** que publica o OTP — nunca antes
(TASK-14).

## Retenção do trial ledger — divulgação obrigatória nesta página

A app **retém deliberadamente** um dado que sobrevive à eliminação da conta, e `docs/specs/TRIAL_REUSE_PREVENTION.md` §4.4 (repo `app`) exige que isso seja dito *«no ecrã de eliminação de conta»* — que é esta página.

Factos, de `092_create_trial_ledger.sql` e `093_create_start_trial_rpc.sql`:

| | |
|---|---|
| O que se guarda | `trial_ledger`: **sha256 do email normalizado** (minúsculas, trim, `+sufixo` removido) — nunca o email, nunca o `user_id` |
| Porque sobrevive | **sem FK, por desenho** — é o objetivo da tabela |
| Retenção | **12 meses** a contar de `trial_end_date` (decisão D-3) |
| Finalidade | única: impedir novo trial à mesma identidade. **Não** métricas, marketing ou antifraude genérico |
| Acesso | RLS ativa, **zero políticas**; `REVOKE ALL FROM anon, authenticated` |
| Base legal | interesse legítimo (considerando 47), **não** exceção do Art. 17.º/3 |
| Direito do titular | **Art. 21.º — oposição.** Tem de haver forma de apagar a linha a pedido |

**Duas armadilhas de copy, evitadas:** (a) o hash é **pseudonimização, não anonimização** — é dado pessoal para nós porque o conseguimos recalcular; a copy não lhe chama anónimo. (b) Sendo interesse legítimo, o direito de oposição está visível, com o endereço.

## Outras retenções — a rever na Fase 2

A frase *«tudo o que são dados foi apagado»* não é exata. Além do trial ledger:

| Retenção | Estado |
|---|---|
| **Backups do Supabase** | Uma linha apagada vive na rotação de backups. A página diz «imediata e irreversível» — verdade para dados vivos, não para backups. Prática corrente: dizer que a eliminação se propaga dentro da janela de retenção. **Copy por corrigir.** |
| **`rate_limits` da landing-page** | PK é o IP (`del:<ip>`, `wl:<ip>`), **sem rotina de limpeza**. IP é dado pessoal. A `note` da página diz que os logs «não o identificam» — **impreciso**. |
| **Email ao operador** | Inclui o IP do requerente. Mesmo problema que a linha acima. |
| **Logs do Resend** | Endereços e conteúdo ficam com um subcontratante. A privacy policy tem de o cobrir. |

## Arquitetura

### Fase 1 — em produção

```
GET  /delete-account          → proxy.ts → /{locale}/delete-account  (Accept-Language)
GET  /[lang]/delete-account   → Server Component: Nav + DeleteAccountSection + Footer
                                conteúdo de conformidade sempre visível, sem login

POST /api/account-deletion
  1. verificação de configuração  (operador + Resend)   → 503 com código
  2. rate limit `del:${ip}`       (try/catch)           → 503 DB_UNAVAILABLE
  3. Zod                                                → 400 INVALID_DATA
  4. Turnstile                                          → 400 CAPTCHA_FAILED:<código CF>
  5. Resend → operador  (replyTo = requerente)  ← É o mecanismo de eliminação
  6. Resend → requerente (acuso de receção, best-effort)
  → 202. Nada é escrito na DB, nada é destruído aqui.
```

### Fase 2 — desenho aprovado

```
POST /api/account-deletion/request   (Turnstile + rate limit `del:${ip}`)
  → signInWithOtp({ shouldCreateUser: false })   [server-side, em after()]
  → resposta CONSTANTE, dispare ou não  (anti-enumeração)

POST /api/account-deletion/verify    { email, code }
  → verifyOtp [server-side] → devolve o access_token ao browser

  [browser, com o Bearer do próprio utilizador]
  → POST /api/account-deletion/registration   (PRIMEIRO — reversível e idempotente)
  → POST /api/account-deletion/confirm    (ÚLTIMO — reencaminha para a edge
                                           function; irreversível)

O browser não fala com o projeto da app em lado nenhum — ver *Porque nada do
projeto da app chega ao browser*.
```

### Decisões e as suas razões

**Porque nada do projeto da app chega ao browser.** O desenho original punha o
`verifyOtp` e a chamada à edge function no browser, o que obriga a servir o URL
e a anon key do projeto da app no bundle — e foi o **Vercel que recusou**
guardar a variável: o scanner dele rejeita um valor com forma de JWT atrás de um
`NEXT_PUBLIC_`, sem opção de forçar. A heurística está certa mesmo estando o
caso errado: a chave legacy *é* um JWT, e um JWT numa variável de ambiente é
quase sempre um segredo a sério. (É por isto que o Supabase passou a emitir
`sb_publishable_…`, que não tem essa forma.)

As duas trocas passaram a route handlers — `/verify` e `/confirm` — e as
variáveis a `APP_SUPABASE_URL` / `APP_SUPABASE_ANON_KEY`, **sem prefixo**. O
argumento de segurança não mudou: continua a não haver credencial privilegiada
nesta árvore, e o token continua a ser o JWT do próprio utilizador, obtido por
ele ao introduzir o código — apenas uma vez mais atrás. O que se ganhou, além de
desbloquear o Vercel: o `@supabase/supabase-js` saiu do bundle do cliente, e a
falha da edge function passou a trazer código estável em vez do
`FunctionsHttpError` opaco que o `functions.invoke` devolvia — no único passo em
que «falhou» e «correu» nunca podem confundir-se.

**A chave ser pública por desenho continua a ser verdade, e continua a não ser
o que nos protege.** O que protege é o RLS do projeto da app, verificado a
2026-09-13: nenhuma política alcançável pela `anon` tem predicado `true` — todas
exigem `auth.uid()` ou uma claim de `service_role` — e o catálogo partilhado
exige `auth.role() = 'authenticated'`. Antes da migration `122` isso não era
verdade (TASK-11).

**Porque o OTP substitui o double opt-in, em vez de o complementar.** Os dois provam a mesma coisa — posse do email. Diferem no que devolvem:

| | Prova | Dá para apagar a conta da app? |
|---|---|---|
| Token da landing-page | posse do email | **não** |
| OTP do projeto da app | posse do email | **sim — o JWT do próprio utilizador** |

Com um token próprio, provada a posse, faltaria credencial para apagar a conta na app. Só há duas formas de a obter: a `service_role` do projeto da app na landing-page, ou uma edge function `delete-account-by-email` com segredo partilhado. **Ambas criam uma credencial que apaga qualquer conta a partir de um endereço** — se vazar, apaga-se a base de utilizadores inteira. O `delete-account` existente aceita o JWT do utilizador, obtido por ele ao introduzir o código. Logo: nenhuma tabela nova, nenhum código novo no repo `app`, nenhuma credencial privilegiada nova. **A autorização para a tabela `deletion_requests` foi pedida e concedida a 2026-09-10, e depois retirada por deixar de ser necessária.**

**Porquê código de 6 dígitos e não magic link.** A app não usa `signInWithOtp` nem magic links — só `resetPasswordForEmail` (`SupabaseAuthService.ts:1124`), que usa o template *Reset Password*. O template *Magic Link* está livre. Ganhos: dispensa a allow-list de Redirect URLs; imune a scanners corporativos (Outlook Safe Links) que consomem o token antes do clique; fluxo num único separador — o que importa para quem já desinstalou a app.

**Porquê o pedido de OTP no route handler, e o que isso não compra.** O Turnstile no handler **não protege o endpoint OTP do Supabase**: um atacante chama `dagpiagorabmliuotkoc.supabase.co/auth/v1/otp` diretamente com a key do APK. Compra (a) proteger a *nossa* página e a *nossa* reputação de entrega, e (b) um sítio onde tornar a resposta constante. O backstop real são os rate limits de auth do Supabase. A alternativa — captcha nativo do Supabase Auth — é *project-wide* e passaria a exigir `captchaToken` no `signInWithPassword` da app em produção: breaking change, descartada.

**Porquê capturar o `access_token` do retorno do `verifyOtp`.** O cliente usa `persistSession: false` para não deixar sessão da app no `localStorage` de `eatease.eu`, logo não se pode depender do estado interno do cliente entre interações. `verifyOtp` devolve `{ data: { session } }` — guardar `data.session.access_token` em estado do componente e passá-lo explicitamente como Bearer. É a versão que não parte num remount.

**Porque a ordem `contacts` → `delete-account` não é negociável.** Depois de a edge function apagar o utilizador, o `sub` do JWT deixa de resolver em `auth.users`, o `getUser(token)` devolve 401 e a linha em `contacts` ficaria **inapagável para sempre** — a pessoa também já não se consegue autenticar. Se o passo do `contacts` falhar, abortar antes de destruir o que quer que seja.

**Porquê `del:${ip}` como chave de rate limit.** `rate_limits.ip` é `text` e é partilhado com `/api/contacts`. Prefixar dá orçamento separado aos dois endpoints sem alterar o schema. Defeito conhecido: o contador incrementa **antes** da validação, portanto falhas causadas por bugs nossos gastam o orçamento do utilizador — mau para depuração.

**Porque o formulário manual permanece na Fase 2.** Cobre quem perdeu o acesso ao email da conta e quem se registou na landing-page sem nunca criar conta na app. A Fase 2 reduz-lhe o tráfego, não o dispensa — e a `DELETION_REQUEST_TO_EMAIL` continua obrigatória.

## Tech Stack

Next.js 16 App Router · React 19 · TypeScript · Tailwind v4 · i18n próprio (dicts por locale, tipo derivado de `en`) · Drizzle + Postgres (projeto da landing-page) · `@supabase/supabase-js` (projeto da app, Fase 2) · Resend · Cloudflare Turnstile

```bash
npx tsc --noEmit     # 0 erros exigidos
npm run lint
npm run build
```

> O servidor de dev é corrido pelo utilizador num terminal próprio — não arrancar `npm run dev`.

## i18n Scope

- Dict `deleteAccount` em `src/lib/i18n/locales/{locale}/deleteAccount.ts`, exportado no `index.ts` de cada locale.
- Padrão **`form`/`pages`** (traduzido nas 10 locales), **não** `legal.englishNotice` (inglês-only): é UI funcional que a pessoa tem de compreender antes de destruir dados irreversivelmente.
- Chave `deleteAccount` no dict `footer`; bloco `deletionRequest` em `emails`.
- **Constraint dura:** `dictionaries.ts` tipa cada loader como `() => Promise<Translations>` e `Translations = typeof en`. Acrescentar uma chave a `en` faz o `tsc` falhar nas outras nove até todas a terem. **As 10 locales têm de ir na mesma task** — separá-las deixa o repo sem compilar.

Estrutura em produção:

```
deleteAccount: {
  title, intro,
  whatIsDeleted: { title, items[] },
  whatRemains:   { title, items[], note },
  timing:        { title, body },
  inApp:         { title, body },
  form:    { title, body, emailLabel, emailPlaceholder, reasonLabel, reasonPlaceholder,
             submit, submitting, successTitle, successBody,
             errorCaptcha, errorRateLimit, errorGeneric, errorNetwork },
  contact: { title, body },
}
```

A Fase 2 acrescenta `step2` (código) e `step3` (confirmação) — ver TASK-13.

### Registo do `pt-pt`: «tu», não «você»

Decisão do Ricardo a 2026-09-10: **o tom é o da app**, que trata por tu. O
`deleteAccount.ts` era o único ficheiro em «você». Corrigidos na mesma passagem
o `aboutUs.value1` («por lhe poupar tempo») e o `pages.linkExpired` («submete o
seu email»), onde a divisão atravessava uma frase. Guardado por
`src/lib/i18n/ptPtRegister.test.ts`.

Nota para quem tocar nas outras: `de` e `fr` tratam por «Sie»/«vous» (formal),
as restantes por tu. O `CLAUDE.md` define a voz como *warm, casual,
second-person* — as duas formais estão por decidir e não foram tocadas.

## Boundaries

- **Sempre:** `npx tsc --noEmit` + `npm run lint` + `npm run build` antes de dar uma task por concluída.
- **Sempre:** toda a resposta de erro carrega um código estável, e a página mostra-o. Numa página com peso legal, uma falha silenciosa é pior do que uma falha ruidosa — foi o que nos custou duas sessões de depuração às cegas.
- **Perguntar primeiro:** alterações ao schema Drizzle; nova dependência npm; qualquer alteração no repo `app` **além das autorizadas nominalmente abaixo**.

  **Autorizado no repo `app` a 2026-09-11**, por decisão explícita do Ricardo, e **só isto**: TASK-11 (migration 122), TASK-23 (123), TASK-20 e TASK-21 (124), TASK-22 (125) e TASK-19 (copy das 10 locales). A autorização incluiu aplicar as migrations a produção sem perguntar migration a migration. **Está esgotada:** as seis estão feitas, e a TASK-24, a TASK-25 e a TASK-26 voltam a cair no «perguntar primeiro».

  **Condição que veio com a autorização, e que fica:** dupla verificação de tudo o que se altera no repo `app`, para não partir nada. Em concreto, e porque esta sessão pagou por isso três vezes — qualquer assinatura de função vem do `pg_get_function_identity_arguments`, nunca do ficheiro `.sql` (ver [`audit-migration-001.md`](./audit-migration-001.md), achado D); e nenhuma afirmação sobre origem ou contagem entra num commit sem `grep`/query que a confirme.
- **Nunca:** hardcodar strings visíveis ao utilizador.
- **Nunca:** aceitar o email do body para decidir o que apagar — só o que vier de um token validado.
- **Nunca:** devolver resposta diferente para email existente vs. inexistente.
- **Nunca:** publicar copy que descreva um fluxo que ainda não existe.
- **Nunca:** ler `.env`/`.env.local` — perguntar ao utilizador.

## Success Criteria

**Fase 1** — todos verificados em produção a 2026-09-10:
- [x] `/delete-account` responde 307 → `/{locale}/delete-account` conforme `Accept-Language`
- [x] A página carrega sem login e mostra dados apagados, retidos, prazo, alternativa in-app, contacto
- [x] O seletor de idioma mantém a página ao mudar de locale
- [x] O formulário envia os dois emails
- [x] Renderiza nas 10 locales · `tsc` 0 erros · `lint` limpo · `build` passa

**Fase 2 — verificada ponta-a-ponta em produção a 2026-09-14**, com uma conta
real: pedido na página, código recebido por email, código introduzido,
confirmação, e a conta desaparecida **na app e em `contacts`**.

- [x] Um utilizador com conta: email → código → confirmação → conta eliminada
- [x] A linha correspondente em `contacts` é removida — **e antes da conta**, o que a observação do resultado não distingue: a ordem vive numa função nomeada (`useAccountDeletion.confirmDeletion`) e está provada por mutação, não pela corrida em produção. Invertê-la faz falhar dois testes.
- [x] Um email sem conta recebe a mesma resposta que um email com conta, em bytes e em tempo — **provado por teste, não em produção**: o teste compara os corpos em bytes, e o `after()` tira a chamada ao Supabase do caminho da resposta, que é o que iguala o tempo.
- [ ] **O formulário manual continua a funcionar** — não foi reverificado depois de a TASK-13 o mover para dentro do `<details>`. O código não mudou (só o sítio onde é renderizado), e a Fase 1 foi verificada a 2026-09-10, mas isso é inferência, não observação. **É o único critério por confirmar, e são dois minutos.**
- [x] As 10 locales anunciam eliminação imediata, no mesmo commit

---

# Tasks

### TASK-01: Extrair helpers partilhados de `/api/contacts`
- **Status:** [x] COMPLETE — `src/lib/turnstile.ts` + `src/lib/rateLimit.ts`; `/api/contacts` importa-os com a chave `wl:${ip}`; removido o `console.log` que expunha o `TURNSTILE_SECRET_KEY`.

### TASK-02: Dict `deleteAccount` nas 10 locales
- **Status:** [x] COMPLETE — 10 dicts, 10 `index.ts`, `footer.deleteAccount`, `emails.deletionRequest`. Inclui a divulgação do trial ledger.

### TASK-06: Formulário de pedido — handler + template + copy
- **Status:** [x] COMPLETE — `/api/account-deletion` + `src/templates/deletion-request.html`. **`next.config.ts` precisou de `outputFileTracingIncludes`** para `/api/account-deletion`: o `renderEmail` lê `src/templates` em runtime com um nome que o tracer não resolve estaticamente.

### TASK-07: `DeleteAccountSection`
- **Status:** [x] COMPLETE (Fase 1) — conteúdo sempre visível + formulário. A máquina de 3 passos é a TASK-13.

### TASK-08: Página `/[lang]/delete-account` + link no footer
- **Status:** [x] COMPLETE — segue o padrão de `privacy-policy`; link na coluna *Support*.

### TASK-10: Variáveis de ambiente + submissão
- **Status:** [x] COMPLETE (variáveis) — `DELETION_REQUEST_TO_EMAIL=privacy@eatease.eu` e `TURNSTILE_SECRET_KEY` corrigida, ambas em Production e Preview.
- **Falta:** submeter `https://www.eatease.eu/delete-account` no Play Console (campo de eliminação **e** formulário *Data safety*).

### TASK-18: Tornar `OPERATOR_MAIL_FAILED` alcançável
- **Status:** [x] COMPLETE — o `try/catch` do envio ao operador nunca disparava: `resend.emails.send()` **não rejeita**, resolve `{ data, error }` para rejeição da API e para falha de rede (`node_modules/resend/dist/index.mjs` — `fetchRequest`). A rota respondia **202 «pedido recebido» com a caixa do operador vazia**. Agora inspecciona `{ error }` e devolve `OPERATOR_MAIL_FAILED:<error.name>` (502); o `try/catch` fica para o que lança de facto.
- **Também corrigido:** `new Resend(process.env.RESEND_API_KEY)` estava em module scope e **lança** quando a chave falta, matando a rota no import — o `CONFIG_MISSING_RESEND` era igualmente inalcançável. Passou a `getResend()` (`src/lib/resend.ts`), que devolve `null` em vez de lançar.
- **Guardado por:** `src/app/api/account-deletion/route.test.ts` (7 testes).

### TASK-15: «ignorar» → «responder para cancelar» nas 10 locales
- **O quê:** as 9 locales não-`pt-pt` diziam na página que ignorar o email bastava — e o pedido já está na caixa do operador quando alguém lê a frase. A `pt-pt` estava ao contrário: email a mandar ignorar, página sem a frase e a prometer uma confirmação que a Fase 1 não tem.
- **Status:** [x] COMPLETE (2026-09-10) — as **20 strings** passam a «responder para cancelar», e a `pt-pt` volta ao prazo dos 30 dias nas duas superfícies. Ver a secção *Divergência de copy* acima.

  **Além da copy, e sem isto a frase nova era tão falsa como a que substituiu:** o email de acknowledgement **não tinha `replyTo`**, portanto mandava responder para o `RESEND_FROM_EMAIL`, que é um no-reply. Passou a `replyTo: operator` — o `DELETION_REQUEST_TO_EMAIL`, que é correcto em qualquer cenário porque essa caixa é lida por definição.

  Guardado por `src/lib/i18n/deleteAccountCopy.test.ts` (30) + `ptPtRegister.test.ts` (3) + 1 asserção em `account-deletion/route.test.ts`.

### TASK-19: [repo `app`] A app prometia mais do que apaga, no ecrã da decisão
- **O quê:** `more.deleteAccount.confirmMessage` dizia «all your data» e «We keep **only** a technical identifier»; o `finalConfirmMessage` dizia «with the **single** exception noted in the previous step». São **três** excepções: o hash do trial, a linha em `contacts` e o endereço na lista de testers do Play Console. As duas últimas o `delete-account` da app não alcança — apaga storage e o utilizador de auth no projeto Supabase **dela**.
- **Porque não bastava a TASK-16:** essa corrigiu o `inApp.body` da landing-page, mas **ninguém lê a landing-page antes de eliminar dentro da app** — a decisão toma-se em Definições → Mais. A frase falsa tinha mudado de sítio, não desaparecido. É a forma do bug da TASK-15 com as superfícies trocadas.
- **Status:** [x] COMPLETE (2026-09-11) — `app/src/i18n/locales/{de,en,es,fr,it,nl,pl,pt,ro,sv}/settings.json`. Commit `ffdcb747` no repo `app`. As 10 declaram as três e apontam `eatease.eu/delete-account` para as duas que a app não alcança — **sem prefixo de locale**, porque o middleware redirecciona um caminho nu para `/{locale}{path}`.

  **A locale do app é `pt`, não `pt-pt`** — o site é que usa `pt-pt`, e o `src/config/links.ts` do repo da app existe precisamente para essa tradução.

  **O `pt` era o caso pior e não o melhor:** não dizia «uma única excepção» porque não dizia excepção nenhuma — não tinha a frase do identificador técnico em nenhuma das duas strings, e afirmava «todos os teus dados» sem ressalva. Foi acrescentada por inteiro, não corrigida. É a TASK-15 outra vez: a locale que parece alinhada com as outras é a que está pior, e só se vê lendo as dez.

  **Parágrafo único, sem `\n`:** não existe um único `\n` literal em nenhum ficheiro de locale do repo da app, e não se abre excepção numa string de `Alert.alert`.

  **Não se acrescentou link nem código,** de propósito: um `getDeleteAccountUrl()` em `src/config/links.ts`, no molde do `getPrivacyPolicyUrl()` que já lá está, é a coisa certa a fazer um dia — mas a autorização era de copy.

  Verificado: `check-i18n` («All locales are complete»), `type-check` a 0, e a suite completa do repo da app a **4151 testes em 208 suites**. O `npm run lint` de lá tem 57 erros de `prettier` **pré-existentes e todos em `.ts`** — o script é `eslint . --ext .ts,.tsx` e nunca leu o JSON que esta task alterou.

### TASK-12: Diagnóstico de falhas
- **Status:** [x] COMPLETE — códigos estáveis em todas as respostas; verificação de configuração primeiro (alcançável por `curl`, sem token do Turnstile); `checkRateLimit` em try/catch; códigos da Cloudflare propagados.

  **Duplicações resolvidas no mesmo trabalho** (§4.5 e o `fail()` repetido nas duas rotas): `fail()` extraído para `src/lib/apiError.ts`, e o `escapeHtml` de `src/lib/email.ts` passou a **exportado** em vez de haver uma segunda cópia idêntica em `api/account-deletion/route.ts`. Fica o que a §4.5 sugeria como melhor opção: dar ao email do operador um template como os outros têm.

---

## Fase 2 — por implementar

**Ordem:** `TASK-09 · 03 · 04 · 05 · 13 · 14`. É tudo na landing-page, exceto a
TASK-09, que é no Dashboard.

Três coisas que é fácil perder de vista ao entrar aqui:

- **A §4.1 da revisão bloqueia a TASK-13** até o `DeleteAccountSection.tsx` ser partido em `useAccountDeletion()` + `<StepEmail>`/`<StepCode>`/`<StepConfirm>`. A ordem obrigatória `contacts` → `delete-account` tem de ficar numa função nomeada, não enterrada num `handleSubmit` de 500 linhas.
- **A TASK-13 herdou dois avisos obrigatórios no passo 3**, ambos pela mesma razão — a eliminação self-service é *imediata* mas não é *completa*: a oposição ao registo de trial (art. 21.º) tem de ser pedida **antes**, e a remoção da lista de testers do Play Console é manual, porque não há API que lá chegue (TASK-E).
- **A TASK-19 já fixou a formulação das três excepções** (hash do trial, linha em `contacts`, endereço na lista de testers) em 10 locales do repo `app`. A copy da TASK-14 alinha-se com essa em vez de inventar uma quarta versão da mesma verdade — já houve três (o `inApp.body` daqui, o `confirmMessage` da app, e o `pt` da app a não dizer nada) e cada divergência custou uma task.

### TASK-09: Template Magic Link (Dashboard, projeto `dagpiagorabmliuotkoc`)
- **O quê:** Auth → Email Templates → **Magic Link**: confirmar que não está em uso e trocar para entregar `{{ .Token }}` (6 dígitos), com copy própria de eliminação de conta — não copy genérica de login. Rever os rate limits de envio de OTP.
- **Verify:** pedir um código em dev e ler o email recebido.
- **Status:** [x] COMPLETE (2026-09-14). O HTML está escrito e testado: `src/templates/deletion-code.html`, guardado por `src/lib/i18n/deletionCodeTemplate.test.ts` (22). Falta colá-lo, e as três decisões de Dashboard abaixo.

  **Verificado a 2026-09-14, e a localização está provada.** Sonda corrida com `--locale pt-pt`: o email chegou **em português**, com o código de seis dígitos e com o remetente do SMTP personalizado. A língua é a prova, e é mais forte do que qualquer diagnóstico: o ramo `pt-pt` só dispara com `{{ if eq .RedirectTo "https://www.eatease.eu/pt-pt/delete-account" }}`, portanto um `.RedirectTo` vazio ou diferente teria rendido inglês. **O `signInWithOtp({ shouldCreateUser: false })` propaga mesmo o `emailRedirectTo` ao template** — era a única pergunta que a suite não respondia.

  **Três tentativas falhadas antes desta, todas a mesma causa:** as configurações estavam a ser feitas no projeto **da landing-page**. Quem emite o código é o projeto da **app** (`dagpiagorabmliuotkoc`), que é onde a conta existe — template, Site URL, Redirect URLs, SMTP e rate limits são todos lá. O ref está no URL do Dashboard, e é a única forma de ter a certeza: os dois ecrãs são iguais. O sinal que o denunciava estava à vista — o email *chegava*, o que com o serviço interno do Supabase só acontece a quem pertence à equipa do projeto.

  **O template é localizado, e o mecanismo é o `.RedirectTo`.** O Supabase tem **um** template por projeto, sem variantes de idioma — mas expõe `{{ .RedirectTo }}` e suporta condicionais Go (`{{ if eq … }}`), ambos confirmados na documentação. O ficheiro escolhe a língua comparando o `.RedirectTo` com `https://www.eatease.eu/{locale}/delete-account`, que é o que a TASK-04 passa em `emailRedirectTo`. **Custo:** esses 10 URLs têm de entrar em *Authentication → URL Configuration → Redirect URLs*, o que reintroduz a allow-list que a decisão do OTP dizia dispensar — mas só para a escolha da língua, não para o fluxo, que continua a não pedir clique nenhum.

  **A sonda existe e é uma linha:** `node scripts/probe-otp-email.mjs --email <conta real> --locale pt-pt`. Fala com o projeto da app diretamente, com a mesma anon key da rota, porque a `/api/account-deletion/request` exige um token do Turnstile que um terminal não produz. O endereço tem de ter conta na app — `shouldCreateUser: false` não cria nenhuma.

  **Por verificar, e decide se a localização vive ou morre:** que o `signInWithOtp({ shouldCreateUser: false })` preenche mesmo o `.RedirectTo` no template do Magic Link. Se vier vazio, o Supabase cai no Site URL e **todas as línguas rendem em inglês** — silenciosamente, que é o modo de falha que esta página não tolera. Sonda: pôr `RT=[{{ .RedirectTo }}]` no template, pedir um código, ler o email.

  **O que não serve, para não voltar a ser proposto:** o *Send Email Hook* localizaria e dispensava a allow-list, mas **substitui o envio de todos os emails de auth do projeto da app**, incluindo o `resetPasswordForEmail` que está em produção — e não teria de onde tirar a locale: o `signUp` da app (`SupabaseAuthService.ts:328-339`) não guarda idioma nenhum em `user_metadata`, e a anon key não lê `user_profiles` sob RLS. Sairia uma tabela nova (alteração de schema) e os emails de reposição de password da app passariam a depender do uptime de `eatease.eu`.

  **Defeito apanhado pelo teste, e vale para qualquer template futuro:** o Go executa **dentro de comentários HTML**. Um `{{ nome }}` sem ponto num comentário é erro de parse no Supabase, e um com ponto renderiza o valor lá dentro. O comentário de cabeçalho do ficheiro não nomeia nenhuma ação de template de propósito.

  **Primeira sonda corrida a 2026-09-13, e o que ela mostrou.** O email chegou com o template **por omissão** do Supabase — link «log in», sem código e sem o nosso desenho — portanto o `deletion-code.html` ainda não está colado e o `{{ .RedirectTo }}` continua por medir. Dois achados à mesma:

  - **O `otp_expired` ao clicar no link é esperado e irrelevante para este fluxo:** nunca pedimos a ninguém que clique. É, aliás, a demonstração do argumento que escolheu código em vez de magic link — um link consumido antes do dono chegar lá.
  - 🔴 **O *Site URL* do projeto da app é `http://localhost:3000`.** Sabe-se porque o erro redirecionou para lá, e o `emailRedirectTo` que a sonda enviou era `https://www.eatease.eu/...`: o destino só pode ter vindo da configuração. É para aí que o Supabase manda qualquer fallback — incluindo o caso em que o `.RedirectTo` não casa e a escolha de língua cai no inglês. **Mudá-lo não mexe na app:** o `resetPasswordForEmail` passa `redirectTo: 'eatease://reset-password'` explicitamente (`SupabaseAuthService.ts:1126`, verificado).

  **Respondido pelo Dashboard a 2026-09-12:** *Email OTP Expiration* = **3600 s**, que confirma a copy «1 hora» nas 10 línguas. Redirect URLs: falta o host — foi acrescentado `https://eatease.eu/**` e o template compara com `https://www.eatease.eu/...`; o Supabase compara a string que recebe, e o redireccionamento apex→www não o ajuda.

  🔴 **O SMTP está desativado, e isso é maior do que esta task.** O serviço interno do Supabase **«refuses to deliver messages to addresses that are not part of the project's team»** (documentação de `auth-smtp`), com 2 mensagens por hora fixas — o Dashboard nem deixa alterar o limite sem SMTP ou hook. Consequências: (a) o OTP só chega ao próprio Ricardo, portanto a Verify desta task e a da TASK-13 não são executáveis; (b) **o `resetPasswordForEmail` da app está a falhar hoje, em produção, para todos os testers** — é um defeito vivo num fluxo publicado, não um pré-requisito desta task. Solução: SMTP personalizado via Resend (`smtp.resend.com`, porta 465, utilizador `resend`, password = uma API key **nova**, para rodar independentemente da landing-page), remetente `noreply@eatease.eu`. Testar uma reposição de password da app logo a seguir — é o fluxo que a mudança toca e que não é nosso.

### TASK-03: Clientes Supabase do projeto da app
- **Ficheiros:** `src/lib/appSupabase.ts` (novo)
- **O quê:** `createClient` de `@supabase/supabase-js` (não `@supabase/ssr`), com `auth: { persistSession: false, autoRefreshToken: false }`. `appSupabaseServer()` para handlers; `appSupabaseBrowser()` singleton de módulo; `APP_FUNCTIONS_URL`.
- **Env:** `NEXT_PUBLIC_APP_SUPABASE_URL` + `NEXT_PUBLIC_APP_SUPABASE_ANON_KEY` (a anon key já vai no APK — publicá-la não acrescenta superfície de ataque).
- **Verify:** DevTools → Local Storage sem chaves `sb-dagpia*`.
- **Status:** [x] COMPLETE (2026-09-12) — `src/lib/appSupabase.ts`, guardado por `src/lib/appSupabase.test.ts` (13 testes). Portão: 193 testes, `tsc` 0, `lint` 0 erros, `build` passa.

  **`APP_FUNCTIONS_URL` é `appFunctionsUrl()`, uma função, não uma constante de módulo.** A configuração é lida por chamada, não no import, pela razão que o `getResend()` já documenta — e as três exportações devolvem `null` em vez de lançar, para a TASK-04 poder responder com um código estável em vez de um 500 sem nada para citar. `process.env.NEXT_PUBLIC_*` fica escrito por extenso em cada sítio: a substituição do Next é textual e um `process.env[nome]` calculado dava `undefined` no bundle do browser.

  **O `appSupabaseServer()` devolve instância nova por chamada** — o `signInWithOtp` e o `verifyOtp` deixam estado de sessão no objeto que fez a chamada, e em Fluid compute o mesmo processo serve vários pedidos.

  **O `appSupabaseBrowser()` existiu e foi removido a 2026-09-13,** com as variáveis a perderem o prefixo `NEXT_PUBLIC_`. O `Verify` original desta task — «DevTools → Local Storage sem chaves `sb-dagpia*`» — deixou de ser aplicável por uma razão mais forte do que passar: **não há cliente nenhum do projeto da app no browser**, nem chave, nem URL. Guardado por uma asserção que falha se alguém voltar a pôr um `process.env.NEXT_PUBLIC_` neste ficheiro.

### TASK-04: `POST /api/account-deletion/request`
- **O quê:** Zod → `checkRateLimit('del:'+ip)` → `verifyTurnstile` → `signInWithOtp({ shouldCreateUser: false })`.
- **Crítico:** resposta **sempre** `{ ok: true }`, exista ou não a conta. Disparar o `signInWithOtp` **sem `await`** (`.catch(console.error)`) — um email existente demora visivelmente mais, o que é por si só um oráculo de enumeração.
- **Verify:** dois `curl -w '%{time_total}'`, corpos idênticos e tempos da mesma ordem.
- **Status:** [x] COMPLETE (2026-09-12) — `src/app/api/account-deletion/request/route.ts`, guardada por `route.test.ts` (14). Portão: 243 testes, `tsc` 0, `lint` 0 erros, `build` passa e regista a rota.

  **A §4.2 ficou cumprida aqui, não antes.** A revisão mandava extrair o `withRequestGuards` antes desta task e apontava a TASK-17 como o momento; verificado no commit `6895af4`, essa task extraiu o `fail()` e o `getResend()` e **não** os guards. Ficou `src/lib/apiGuards.ts` (`runRequestGuards`, 11 testes) e esta rota é a primeira consumidora. **O `/api/contacts` e o `/api/account-deletion` continuam com a cópia deles** — migrá-los é refactor de um caminho de conformidade e de um de inscrição, e leva commit próprio com os 225+7 testes deles como portão.

  **O `after()` do Next substituiu o «sem `await`» do desenho, e corrige mais do que o oráculo de tempo.** Uma promessa solta é cortada quando a função serverless é desmontada ao responder: o email deixaria de sair de vez em quando, com o utilizador já informado de que estava tudo bem. O `after()` corre depois da resposta e mantém a função viva. A constância no tempo vem de graça, porque a chamada ao Supabase já não está no caminho da resposta.

  **O `emailRedirectTo` não é destino nenhum** — este email não tem um único link. Viaja só para chegar ao template como `{{ .RedirectTo }}`, que é o único sinal disponível para escolher a língua. Por isso é uma constante (`src/lib/deletionPageUrl.ts`) e não o `NEXT_PUBLIC_SITE_URL`: um pedido de localhost tem de produzir o mesmo email localizado que produção, e a allow-list do projeto da app fica com exatamente 10 URLs em vez de um conjunto por ambiente.

  **A rota e o template derivam do mesmo `deletionPageUrl()`,** e o teste do template passou a asseri-lo contra a função em vez de contra uma cópia da string. Sem isso os dois lados podiam divergir com os dois ficheiros de teste verdes — e o sintoma seria um email em inglês, sem erro em lado nenhum.

  **Verify por correr, e bloqueado pela configuração de SMTP** (ver TASK-09): sem SMTP personalizado o serviço interno do Supabase **recusa entregar a quem não pertence à equipa do projeto**, portanto os dois `curl -w '%{time_total}'` mediriam o mesmo caminho nos dois casos e não provavam nada.

### TASK-05: `POST /api/account-deletion/registration` (nasceu `/waitlist`)
- **O quê:** lê `Authorization: Bearer` → `getUser(token)` → 401 se inválido → `db.delete(contacts).where(eq(contacts.email, user.email))`. Idempotente.
- **Crítico:** o email **nunca** vem do body.
- **Status:** [x] COMPLETE (2026-09-12) — `src/app/api/account-deletion/registration/route.ts`, guardada por `route.test.ts` (11). Portão: 254 testes, `tsc` 0, `lint` 0 erros, `build` regista a rota.

  **Nada é lido do payload — nem uma chave.** O teste que prova isto envia um `email` diferente no body e assere que o SQL executado leva o do token e não o do body. É a asserção que impede que um código enviado a uma pessoa se torne uma forma de apagar a linha de outra.

  **A comparação é `lower() = lower()`, e é um defeito que existia.** O `/api/contacts` insere o email exatamente como foi escrito (o Zod não normaliza), enquanto o Supabase devolve sempre em minúsculas. Um `eq()` deixava `Alguem@Exemplo.com` na tabela **e respondia com sucesso** — a pior combinação possível numa via de apagamento. O índice único de `email` não serve o `lower()`; numa tabela desta dimensão não custa nada, e fica dito para quando deixar de ser pequena.

  **Sem captcha e sem rate limit, ao contrário das rotas vizinhas.** Chegar aqui já exigiu receber um código por email e trocá-lo por um JWT, e um limite nesta rota podia deixar alguém a meio do fluxo com a conta já apagada — o único estado que este desenho recusa criar.

  **O `DB_UNAVAILABLE` é o que protege a ordem.** Se esta rota respondesse ok com a linha por apagar, o passo seguinte destruía a conta e a linha ficava inalcançável para sempre. Guardado por um teste.

  **Passou a chamar-se `/registration` a 2026-09-13.** Nasceu `/waitlist` e o nome ficou obsoleto no commit `b699b00`, quando o formulário deixou de abrir uma lista de espera e passou a inscrever testers — o endpoint apaga a linha em `contacts`, que a página chama «o teu registo neste site» nas 10 locales. A chave `step3.errorWaitlist` seguiu o mesmo caminho. **Não renomeada, de propósito:** a âncora `#waitlist` da homepage, que tem links já espalhados.

  **A resposta traz `removed`, a contagem de linhas apagadas: é o que a Verify ponta-a-ponta da TASK-13 usa para provar que este passo correu mesmo — não há leak, quem chama é o dono verificado do endereço.

### TASK-13: Máquina de 3 passos no `DeleteAccountSection`
- **O quê:** passo 1 email+Turnstile → passo 2 código de 6 dígitos (`verifyOtp`, guardar `access_token` em estado) → passo 3 confirmação explícita → `/waitlist` → `delete-account`. O formulário manual passa a disclosure «Não consigo aceder ao meu email».
- **Design:** vermelho só no botão irreversível do passo 3; teal no resto.
- **Verify:** fluxo completo com conta real, e **confirmar que a linha em `contacts` desapareceu**. Nem a TASK-05 nem a TASK-13 isoladamente apanham o bug de ordenação — só o teste ponta-a-ponta.
- **Status:** [x] COMPLETE (2026-09-13), no mesmo commit que a TASK-14. Portão: 328 testes, `tsc` 0, `lint` 0 erros, `build` passa.

  **A §4.1 foi feita primeiro, como ela exigia.** `src/components/landing/deleteAccount/`: `useAccountDeletion.ts` (a máquina e as duas chamadas encadeadas), `StepEmail`/`StepCode`/`StepConfirm` (só apresentação), `SelfServiceDeletion` (contentor sem lógica) e `ManualRequestForm` (o formulário da Fase 1, movido para dentro de um `<details>`). O `DeleteAccountSection` deixou de ser Client Component — já não tem `"use client"` e não envia JavaScript nenhum.

  **A ordem obrigatória está numa função nomeada e testada por mutação.** Trocar as duas chamadas no `confirmDeletion` faz falhar exatamente dois testes — o da ordem e o do «não destrói nada se o `contacts` falhar» — verificado invertendo-as de propósito. É a prova que o spec dizia não existir em nenhuma das duas tasks isoladamente.

  **Guardado por `useAccountDeletion.test.tsx` (14).** Inclui o caso que não é óbvio: um `verifyOtp` que devolve `error: null` mas `session: null` é tratado como falha, porque sem token não há com que autorizar a eliminação e avançar mostraria o passo 3 a quem não o consegue completar.

  **Os dois avisos da §3.6 estão no passo 3, nas 10 locales,** e as asserções que os guardam estão no `deleteAccountCopy.test.ts` — o `tsc` vê uma chave presente, tipada e possivelmente vazia.

  **Verify feita a 2026-09-14, em produção,** com uma conta real: a conta desapareceu na app *e* em `contacts`. É a corrida que o spec dizia ser a única capaz de apanhar o bug de ordenação — com a ressalva de que o resultado observado não distingue a ordem, e quem a guarda continua a ser o teste de mutação.

### TASK-14: Copy e retenções, no mesmo commit da Fase 2
- **O quê:** 10 locales — prazo de «30 dias» → imediato após confirmação; alinhar `pt-pt`, que já foi editada; corrigir a `note` sobre logs (guardamos IP em `rate_limits` e no email ao operador); mencionar a janela de backups do Supabase.
- **Porquê no mesmo commit:** a copy só se torna verdadeira quando o OTP existir.
- **Status:** [x] COMPLETE (2026-09-13), no commit da TASK-13.

  **O prazo dos 30 dias não foi retirado, e não podia ser.** O formulário manual permanece na Fase 2 — para quem perdeu o acesso ao email da conta e para quem se inscreveu aqui sem nunca ter criado conta na app — e continua a ser tratado à mão. O `timing.body` passou a descrever **os dois** caminhos: imediato com código, 30 dias pelo formulário. O `form.successBody` mantém os 30 dias porque é a página de sucesso *desse* formulário, e as asserções que já existiam continuam a valer com o sentido certo.

  **As duas chaves do ledger,** como a §3.6 exigia: o texto passou a declarar o hash do email **e** o do identificador do fornecedor de início de sessão, alinhado com `privacyPolicy.ts:378`. E diz onde está a janela: a oposição tem de ser pedida **antes**, porque depois de a conta desaparecer o identificador do fornecedor deixa de poder ser associado à pessoa.

  **A `note` dos logs era falsa e foi corrigida.** Dizia que os registos «não te identificam»; guardamos o IP na `rate_limits` e no email ao operador. A nova redação nomeia os dois sítios, diz para que serve e oferece o apagamento a pedido — e **não** promete uma retenção que não praticamos, porque a `rate_limits` não tem rotina de limpeza.

  **Acrescentada a divulgação dos backups,** que faltava: a eliminação é imediata nos dados vivos, e as cópias de segurança rodam pelo calendário do fornecedor.

  **O `CONTACT_EMAIL` deixou de estar hardcoded** (§4.6) — passou a `contact.email` nas 10 locales, com um teste a fixar o endereço.

### TASK-11: [repo `app`] Fechar `rate_limits` à role `anon`
- **O quê:** `001_add_security_indexes.sql:44-48` cria duas políticas `USING (true)` **sem cláusula `TO`** → o Postgres assume `TO public`, que inclui `anon`. Qualquer pessoa com a key do APK lê, altera e **apaga** a tabela de rate limiting. Nova migration: `DROP POLICY` das duas, recriar com `TO service_role`.
- **Verify:** `curl` ao PostgREST com a anon key, antes e depois.
- **Status:** [x] COMPLETE — `app/database/migrations/122_lock_rate_limits_to_service_role.sql`, aplicada a 2026-09-11 (`20260911100930`). Commit `eb3b87e9` no repo `app`.

  **O «O quê» desta task estava incompleto, e o DROP POLICY sozinho não a fechava.** Duas das seis vias de acesso nunca consultam RLS: `check_rate_limit` e `cleanup_expired_rate_limits` são `SECURITY DEFINER` de `postgres`, que tem `rolbypassrls`, e tinham `EXECUTE` concedido a `anon`. E `cleanup_expired_rate_limits()` apaga tudo o que tem mais de uma hora — **`EXECUTE` nela é `DELETE` na tabela**. Além disso o RLS só é consultado *depois* de o teste de privilégio da tabela passar, e `anon` tinha o conjunto `arwdDxt` completo: era por isso que o PostgREST respondia `200`/`204` em vez de «permission denied». A migration faz as três coisas — políticas, grants da tabela, `EXECUTE` das funções — e revoga **pelo nome**, não só de `PUBLIC` (lição da `094`, reverificada: há `ALTER DEFAULT PRIVILEGES` a conceder a `anon` por dois concedentes). Precisando: isso morde nas **funções**, cujo acl tem as duas entradas ao mesmo tempo (`=X/postgres` é a de `PUBLIC`, `anon=X/postgres` é a do `anon`); a **tabela** não tinha entrada de `PUBLIC` nenhuma, portanto o `FROM PUBLIC` nela não revoga nada hoje e está lá por segurança.

  **Verificado antes e depois,** da internet aberta e só com a anon key:

  | Pedido | Antes | Depois |
  |---|---|---|
  | `GET /rest/v1/rate_limits` | `200 []` | `401` `42501 permission denied for table` |
  | `POST /rest/v1/rpc/cleanup_expired_rate_limits` | `204` | `401` `42501 permission denied for function` |
  | `POST /rest/v1/rpc/check_rate_limit` | `200` | `401` `42501 permission denied for function` |

  E como `anon` dentro da BD, em transação revertida: `SELECT`/`INSERT`/`UPDATE`/`DELETE` e as duas RPC, todos aceites antes, todos `42501` depois. O teste vive em `app/database/migrations/test_122_rate_limits_locked.sql` — falha antes nomeando cada via aberta, passa depois, e não precisa de key nem de rede.

---

## Tasks abertas pela verificação da TASK-11

Quatro achados da verificação, todos no repo `app` e **nenhum autorizado pelos
*Boundaries*** — carecem de decisão do Ricardo antes de se tocar em código.
Escritas aqui para não se perderem; a TASK-23 é a que não devia esperar.

### TASK-23: [repo `app`] A mesma classe da TASK-11, em duas funções com escrita a sério
- **O quê:** o linter do Supabase (`anon_security_definer_function_executable`), corrido depois da `122`, lista mais **seis** funções `SECURITY DEFINER` executáveis por `anon`. Quatro são inofensivas — `handle_new_user`/`handle_updated_at` são funções de trigger (sem `NEW` falham), e `accept_meal_plan`/`update_user_profile_secure` **verificam `auth.uid()`** (lido o corpo das duas: a segunda devolve `'User not found or unauthorized'` a quem não está autenticado). **Duas não verificam nada:**
  - `cleanup_expired_sessions()` — `UPDATE public.user_sessions SET revoked_at = NOW()` em todas as expiradas e `DELETE` das revogadas há mais de 30 dias. Zero verificação de quem chama. É a gémea exacta do `cleanup_expired_rate_limits`, na mesma migration `001`, sobre uma tabela com **11 linhas**.
  - `migrate_existing_user_profiles()` — `RETURNS TABLE(user_id uuid, …)` e faz `UPDATE public.user_profiles` a partir do `raw_user_meta_data` do `auth.users`. Zero verificação. Devolve **UUIDs de utilizadores reais** a quem a chamar: **8 das 18** linhas de `user_profiles` batem no filtro dela. É um ajudante de migração de uso único que ficou executável para sempre.
- **Porquê é uma task e não um `fix` já feito:** os *Boundaries* só autorizam a TASK-11 no repo `app`. E, ao contrário da `122`, esta **tem chamadores possíveis** — `user_sessions` tem linhas, `user_profiles` tem 18 — portanto quem a fizer verifica primeiro quem chama o quê, em vez de revogar às cegas.
- **Não verificado empiricamente, de propósito:** provar a via do `migrate_existing_user_profiles` exigia executar uma escrita não autenticada em produção; foi bloqueado e não se contornou. A prova é o corpo das funções (`pg_get_functiondef`) e as contagens de linhas, ambos lidos.
- **O quê, quando se fizer:** migration nova, no molde da `122` — `REVOKE EXECUTE … FROM PUBLIC, anon, authenticated`, `service_role` fica. E estender o `test_122` a estas duas, ou fazer-lhe um par.
- **Status:** [x] COMPLETE — `app/database/migrations/123_lock_unauthenticated_security_definer_writers.sql`, aplicada a 2026-09-11. Commit `dfa3d380` no repo `app`. Antes → depois, com a anon key da internet aberta: `POST /rpc/cleanup_expired_sessions` `204` → `401 42501`; `POST /rpc/migrate_existing_user_profiles` `200` → `401 42501`. Teste em `test_123_security_definer_locked.sql` — afirma os grants **primeiro** e recusa-se a chamar o que quer que seja antes de eles caírem, precisamente para não correr uma escrita não autenticada em produção; falhou nos 6 grants antes, passa os dois blocos depois.

  **O RPC era a única porta, e isso foi verificado:** `user_sessions`, `user_profiles` e `user_auth_providers` têm DML concedido a `anon`, mas as políticas delas filtram por `auth.uid() = user_id`, que para `anon` é `NULL`. Como `anon`: **0 linhas nas três**. Os `refresh_token` de `user_sessions` nunca estiveram expostos. E o acesso do app à tabela é directo como `authenticated` — não foi tocado.
- **O argumento para não fazer disto três follow-ups:** `cleanup_expired_sessions()` está na **mesma migration `001`** que as duas que a `122` fechou, e tem a forma exacta da `cleanup_expired_rate_limits()`. A `001` cria **quatro** funções e **as quatro** eram `SECURITY DEFINER` executáveis por `anon` — três sem travão nenhum; a quarta, `update_user_profile_secure`, escapa só porque verifica `auth.uid()`, o que é acidente de quem a escreveu e não desenho da migration. Isso deslocou a pergunta de «fechar este defeito» para «o que mais está na `001`».

  → **Auditoria feita: [`audit-migration-001.md`](./audit-migration-001.md).** Saíram dela duas tasks novas (TASK-24 e TASK-25) e o achado estruturante: **a `001` já não descreve esta base de dados** — 7 das 20 colunas que ela escreve não existem, portanto não é reaplicável, e duas das quatro funções foram substituídas sem migration que o registe.

  **Correção ao que estava escrito aqui antes:** `migrate_existing_user_profiles` **não vem da `001`** — vem da `010_fix_user_profile_trigger.sql:53`. A minha primeira análise juntou as duas funções na mesma origem; são de migrations diferentes, o que enfraquece o argumento do «mesmo autor» e não o do «mesma classe de defeito», que é o que importa.

### TASK-20 e TASK-21: [repo `app`] `rate_limits` estava morta — apagada
- **O quê:** a tabela tinha **0 linhas**, e `rate_limits`, `check_rate_limit` e `cleanup_expired_rate_limits` não apareciam em sítio nenhum do repo `app` fora da própria migration `001`. Nenhum `cron.job` os chamava — a linha 193 da `001` é uma sugestão comentada que nunca correu. Infraestrutura especulativa que nunca teve um chamador.
- **A TASK-21 resolveu-se por eliminação:** o `check_rate_limit` vivo tinha **3** argumentos (a `001` declara 4) e tinha perdido o guard `current_count IS NULL OR`. Como `SELECT … INTO` sobre zero linhas deixa a variável a `NULL` e `NULL < 100` é `NULL` e não `TRUE`, entrava sempre no `ELSE`: **recusava o primeiro pedido de cada identificador e nunca registou uma linha.** Corrigi-la era escrever código novo para zero chamadores.
- **Status:** [x] COMPLETE — `app/database/migrations/124_drop_dead_rate_limiting.sql`, aplicada a 2026-09-11. Commit `08ca9070`.

  **Zero dependências antes de apagar** — sem FK, vista, vista materializada ou trigger a apontar para a tabela (`pg_constraint`, `pg_depend`, `pg_trigger`, `pg_views`). Por isso **não há `CASCADE`**, e não deve haver: se aparecer uma dependência, a migration deve falhar alto. As funções vão **primeiro**, porque os corpos plpgsql não entram no grafo de dependências — apagar a tabela à frente passava e deixava duas funções a referenciar uma tabela inexistente, sem erro até alguém as chamar.

  Percurso completo das três vias, com a anon key da internet aberta: `200`/`204` → **`401 42501`** (122) → **`404`** (124).

  **Sem regressão, e é o detalhe que vale:** o `test_122_rate_limits_locked.sql` continua a passar 4/4 *depois* de o seu objecto desaparecer, porque conta `undefined_table`/`undefined_function` como fechado. Era o desenho — a garantia da 122 sobrevive à eliminação do sujeito, em vez de o teste ter de ser apagado com ele.

### TASK-21: [repo `app`] O `check_rate_limit` vivo está avariado e a `001` já não o descreve
- **O quê:** duas divergências entre a função em produção e a `001`, ambas lidas em `pg_get_functiondef`:
  1. **Assinatura:** a viva tem **três** argumentos (`p_identifier text, p_endpoint text, p_limit integer`); a `001` declara quatro (mais `p_window_minutes integer DEFAULT 60`). Foi substituída fora das migrações — não há migration que o registe.
  2. **Corpo:** perdeu o guard `current_count IS NULL OR`. Como `SELECT … INTO` sobre zero linhas deixa `current_count` a `NULL`, e `NULL < 100` é `NULL` e não `TRUE`, a função entra sempre no `ELSE` — **devolve `FALSE` ao primeiro pedido de cada par identificador/endpoint e nunca insere linha nenhuma.** Um rate limiter que recusa tudo e não conta nada. Foi assim que se explicou o `200 false` do probe com 0 linhas na tabela.
- **Impacto real: nenhum**, porque não tinha chamadores.
- **Status:** [x] COMPLETE — resolvida por eliminação na mesma migration `124`. Ver TASK-20 acima. O detalhe fica registado porque a divergência assinatura-vs-migration é o achado **D** da [`audit-migration-001.md`](./audit-migration-001.md), e esse não desaparece com a função.

### TASK-22: [repo `app`] `search_path` mutável — 15 funções pinadas
- **O quê:** `proconfig` a `NULL` significa correr com o `search_path` do chamador. O ataque: o chamador aponta o `search_path` para um schema seu com uma tabela homónima, e uma `SECURITY DEFINER` passa a ler ou escrever o objecto dele com os privilégios do dono. Era o `function_search_path_mutable` do linter — **18** funções, que a `124` reduziu a 16 ao apagar duas.
- **Status:** [x] COMPLETE — `app/database/migrations/125_pin_function_search_path.sql`, aplicada a 2026-09-11. Commit `42edd555`. **25 de 25** funções de `public` pinadas (eram 10/25).

  **O valor mudou face ao que foi aprovado, e é a correção que importa registar.** A proposta dizia `SET search_path = ''`. Usou-se **`public, pg_temp`**, por duas razões:

  1. **`''` obriga a qualificar cada referência em cada corpo** — e várias destas são funções de trigger em tabelas vivas: a `update_updated_at_column` sozinha serve **10** triggers (`user_profiles`, `subscriptions`, `meal_plans`, …) e a `handle_new_user` serve o trigger de `auth.users` que cria o perfil no registo. Uma referência não qualificada sob `''` não falha no `ALTER`: falha no `INSERT` seguinte, em produção, no caminho do registo.
  2. **`public, pg_temp` é mais seguro do que parece, e do que um `pg_catalog, public`.** Se `pg_temp` **não** for listado explicitamente, o Postgres procura-o **primeiro**, à frente de tudo. Nomeá-lo no fim é o que impede um chamador de sombrear uma tabela real com uma temporária do mesmo nome dentro de uma `SECURITY DEFINER`. E é a convenção que o projecto já tinha nas seis funções do trial (migrations `093`-`096`).

  **Verificado antes:** nenhuma das 16 usa tabela temporária, nenhuma chama função de schema de extensão, e as três que tocam outro schema fazem-no qualificado (`auth.uid()`, `auth.users`). Com `public` à frente do path, qualquer referência não qualificada a `public` resolve como hoje — é preservador de comportamento por construção.

  **Exercitado, não deduzido:** `UPDATE` no-op revertido em `user_profiles` (18 linhas), `user_favorite_recipes` (8), `logged_meals` (4), `meal_plan_member_portions` (92), `family_members_macro_calculations` (10) e `user_macro_calculations` (9) — passou nas seis, o que dispara todas as funções de trigger ligadas, incluindo os dois validadores. Os dois validadores puros chamados directamente devolvem o resultado certo.

  **E o caso interessante, o `handle_new_user`:** escrever em `auth.users` foi bloqueado e não se contornou. Em vez disso ligou-se a função real a uma tabela temporária com os três campos que ela lê do `NEW`, dentro de transacção. O corpo correu e falhou em **`23503`** — violação da FK para `auth.users`, porque o uuid era inventado — e **não** em `42P01 relation does not exist`. É essa distinção que prova o que interessa: sob o `search_path` pinado, a função resolveu `public.user_profiles`, avaliou os `CASE`/regex/casts e chegou ao `INSERT`.

  Reversível com `ALTER FUNCTION … RESET search_path`.

---

## Tasks abertas pela auditoria da `001` — todas «perguntar primeiro»

A autorização de 2026-09-11 está esgotada. Estas três são novas e nenhuma está autorizada.

### TASK-24: [repo `app`] `update_user_profile_secure` está morta **e** avariada
- **O quê:** zero chamadores (`grep` a `src`, `supabase`, `scripts`), e das 22 colunas que escreve **4 já não existem** em `user_profiles` — `calorie_goal`, `family_members`, `fat_goal`, `protein_goal`. A primeira chamada autenticada a sério levantaria `42703 column does not exist`. Nunca deu erro a ninguém porque o `auth.uid()` barra o `anon` antes do `UPDATE` e não há chamador autenticado.
- **É a forma da TASK-21:** função morta que ninguém sabe que está avariada, à espera de ser adoptada por quem julgue que funciona.
- **O quê, se autorizada:** `DROP FUNCTION`. Corrigi-la é escrever código novo para zero chamadores.
- **Status:** [ ] TODO — **perguntar primeiro**

### TASK-25: [repo `app`] 12 dos 15 índices da `001` sem uso registado
- **O quê:** `pg_stat_user_indexes.idx_scan` a zero em 12 dos 15, com `stats_reset` a `NULL`. Os 3 com leituras: `idx_user_sessions_user_id` (15) e três de `rate_limits` cujas contagens eram dos probes desta sessão — e esses já foram com a `124`. O custo não é espaço (16 kB cada), é escrita: cada índice é mantido em cada `INSERT`/`UPDATE`.
- **Ressalva que tem de acompanhar a task:** «0 scans» é «nenhum desde que estas estatísticas começaram», e uma reposição por upgrade ou crash não deixa marca. É **forte indício, não prova** — e um índice que serve um caminho raro (suporte, relatório) é legitimamente zero. A decisão é de quem conhece os caminhos, não do contador.
- **Status:** [ ] TODO — **perguntar primeiro**

### TASK-27: [repo `app`] Os cinco crons são invocáveis da internet aberta, sem chave nenhuma
- **O quê:** `config.toml:36-47` põe `verify_jwt = false` nos cinco `*-cron` — correto, o agendador não traz JWT — mas **nenhum deles olha para o pedido**: os cinco são `Deno.serve(async () => {...})`, sem cláusula de autenticação. E o gateway de funções não exige `apikey` antes de encaminhar: um `POST` sem chave nenhuma a uma função inexistente responde `404`, não `401` (verificado a 2026-09-13). Logo qualquer pessoa que saiba o ref do projeto os dispara.
- **Impacto, com os limites medidos e não presumidos:** o `notification-cleanup-cron` apaga, mas só o que a política de retenção já marcava — invocá-lo mil vezes não apaga mais do que às 3 da manhã. Os de lembretes têm guarda de idempotência (`alreadySent`, `trial-reminder-cron:208,251`), portanto não há spam ao utilizador. **Fica o custo de invocação e o princípio:** cinco endpoints públicos que escrevem e apagam, sem porteiro.
- **Não tem nada a ver com a anon key,** e é por isso que está registado aqui: publicá-la no site não muda isto em nada. Já estava assim.
- **O quê, se autorizada:** cabeçalho de segredo partilhado verificado à entrada das cinco (`CRON_SECRET`), com o agendador a enviá-lo. É o padrão que o `delete-account` já tem noutra forma.
- **Status:** [ ] TODO — **perguntar primeiro**

### TASK-26: [repo `app`] Ainda há 4 `SECURITY DEFINER` executáveis por `anon`
- **O quê:** depois da `122`/`123`/`124`, o linter conta **4** (eram 6): `accept_meal_plan(jsonb)`, `handle_new_user()`, `handle_updated_at()` e `update_user_profile_secure(uuid, jsonb)`.
- **Nenhuma é a emergência que a TASK-23 era, e é por razões diferentes:** `handle_new_user` e `handle_updated_at` são funções de trigger — chamá-las por RPC falha por falta de contexto de trigger; `accept_meal_plan` e `update_user_profile_secure` verificam `auth.uid()`. É higiene, não um buraco.
- **O quê, se autorizada:** `REVOKE EXECUTE … FROM PUBLIC, anon`, no molde da `123`. As duas de trigger não deviam estar no schema exposto de todo.
- **Status:** [ ] TODO — **perguntar primeiro**

---

## Fora de scope

- Exportação de dados (Art. 20.º — portabilidade). Obrigação real a prazo, não é o que a Google pede.
- Eliminação parcial de dados · dashboard de gestão de pedidos.
- ~~Framework de testes na landing-page~~ — **decisão revertida a 2026-09-10.** Vitest 5 + jsdom + Testing Library instalados (`npm test`, 180 testes em 10 ficheiros), depois de a §2.4 da revisão mostrar que a classe de bug que nos custou duas sessões (um guard que nunca dispara) não é apanhável por `tsc`, `lint` nem `build`.

  Duas notas de instalação, para não se repetir a investigação: **`@vitejs/plugin-react` foi descartado** — puxa Babel 8 e colide com o `babel-plugin-react-compiler`, que está em Babel 7; o esbuild do Vitest transforma TSX sem ele. E o **`@types/node` subiu de `^20` para `^24`**, exigência do Vitest 5 e alinhado com o Node 24 em uso.
- Cache partilhado `recipes`/`recipe_translations` com escrita livre a qualquer autenticado (`038a`, `060`) — decisão consciente e documentada, não é `anon`.
- Rotina de limpeza da tabela `rate_limits` — ver *Outras retenções*.

## Open Questions

1. **Palavra de confirmação do passo 3** — traduzida por locale («ELIMINAR»/«DELETE»/…) ou uma só em EN? Traduzida é mais compreensível; fixa é mais simples de validar.
2. **Apple Private Relay** — contas criadas com *Hide My Email* podem não conhecer o `*@privaterelay.appleid.com`. O formulário manual cobre-as, mas testar com uma conta Apple real antes de anunciar o self-service.
3. **Janela de retenção dos backups do Supabase** — qual é o valor real no plano atual? Necessário para a copy da TASK-14.
