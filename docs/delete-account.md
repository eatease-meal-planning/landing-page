# Spec: Página pública de eliminação de conta

> **Fase 1 — EM PRODUÇÃO** desde 2026-08-31. `https://www.eatease.eu/delete-account`, 10 locales, verificada ponta-a-ponta a 2026-09-10.
> **Fase 2 — aprovada, por implementar.** Self-service por OTP, que substitui a eliminação manual.
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

## ⚠️ Divergência de copy a resolver com a Fase 2

A 2026-09-10 a copy `pt-pt` foi editada para descrever o fluxo com confirmação — que **ainda não existe**. Duas consequências enquanto a Fase 2 não for publicada:

| | `pt-pt` (editada) | outras 9 locales |
|---|---|---|
| Prazo na página | «apenas após a confirmação» | «no prazo de 30 dias» |
| Email `ignore` | «basta ignorares e nada acontecerá» | «responde e nós cancelamos» |

**O ponto que importa:** hoje **não há passo de confirmação**. O operador recebe o pedido de qualquer forma. Dizer a alguém que ignorar basta é impreciso — num pedido malicioso contra terceiro, a vítima seguiria a instrução e o pedido continuaria na caixa do operador. A copy anterior («responde e nós cancelamos») era a correta para o fluxo manual.

**Mitigação em vigor:** o operador não elimina uma conta só porque chegou um pedido; verifica primeiro, e o `replyTo` do email aponta para o requerente exatamente para isso.

**Resolução:** a copy fica verdadeira no momento em que a Fase 2 for publicada. As 10 locales passam a «imediato após confirmação» **no mesmo commit** que publica o OTP — nunca antes.

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
  → signInWithOtp({ shouldCreateUser: false })   [server-side]
  → resposta CONSTANTE, dispare ou não  (anti-enumeração)

  [browser] verifyOtp → data.session.access_token
  → DELETE linha em contacts   (Bearer; PRIMEIRO — reversível e idempotente)
  → POST delete-account        (Bearer; ÚLTIMO — irreversível)
```

### Decisões e as suas razões

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

## Boundaries

- **Sempre:** `npx tsc --noEmit` + `npm run lint` + `npm run build` antes de dar uma task por concluída.
- **Sempre:** toda a resposta de erro carrega um código estável, e a página mostra-o. Numa página com peso legal, uma falha silenciosa é pior do que uma falha ruidosa — foi o que nos custou duas sessões de depuração às cegas.
- **Perguntar primeiro:** alterações ao schema Drizzle; nova dependência npm; qualquer alteração no repo `app` além da TASK-11.
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

**Fase 2:**
- [ ] Um utilizador com conta: email → código → confirmação → conta eliminada, e `GET /auth/v1/user` com aquele token passa a falhar
- [ ] A linha correspondente em `contacts` é removida **antes** da eliminação da conta
- [ ] Um email sem conta recebe **exatamente** a mesma resposta que um email com conta, **em bytes e em tempo**
- [ ] O formulário manual continua a funcionar para quem não completa o OTP
- [ ] As 10 locales passam a anunciar eliminação imediata, no mesmo commit

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

### TASK-12: Diagnóstico de falhas
- **Status:** [x] COMPLETE — códigos estáveis em todas as respostas; verificação de configuração primeiro (alcançável por `curl`, sem token do Turnstile); `checkRateLimit` em try/catch; códigos da Cloudflare propagados.

---

## Fase 2 — por implementar

### TASK-09: Template Magic Link (Dashboard, projeto `dagpiagorabmliuotkoc`)
- **O quê:** Auth → Email Templates → **Magic Link**: confirmar que não está em uso e trocar para entregar `{{ .Token }}` (6 dígitos), com copy própria de eliminação de conta — não copy genérica de login. Rever os rate limits de envio de OTP.
- **Verify:** pedir um código em dev e ler o email recebido.
- **Status:** [ ] TODO — **requer acesso ao Dashboard (utilizador)**

### TASK-03: Clientes Supabase do projeto da app
- **Ficheiros:** `src/lib/appSupabase.ts` (novo)
- **O quê:** `createClient` de `@supabase/supabase-js` (não `@supabase/ssr`), com `auth: { persistSession: false, autoRefreshToken: false }`. `appSupabaseServer()` para handlers; `appSupabaseBrowser()` singleton de módulo; `APP_FUNCTIONS_URL`.
- **Env:** `NEXT_PUBLIC_APP_SUPABASE_URL` + `NEXT_PUBLIC_APP_SUPABASE_ANON_KEY` (a anon key já vai no APK — publicá-la não acrescenta superfície de ataque).
- **Verify:** DevTools → Local Storage sem chaves `sb-dagpia*`.
- **Status:** [ ] TODO

### TASK-04: `POST /api/account-deletion/request`
- **O quê:** Zod → `checkRateLimit('del:'+ip)` → `verifyTurnstile` → `signInWithOtp({ shouldCreateUser: false })`.
- **Crítico:** resposta **sempre** `{ ok: true }`, exista ou não a conta. Disparar o `signInWithOtp` **sem `await`** (`.catch(console.error)`) — um email existente demora visivelmente mais, o que é por si só um oráculo de enumeração.
- **Verify:** dois `curl -w '%{time_total}'`, corpos idênticos e tempos da mesma ordem.
- **Status:** [ ] TODO

### TASK-05: `POST /api/account-deletion/waitlist`
- **O quê:** lê `Authorization: Bearer` → `getUser(token)` → 401 se inválido → `db.delete(contacts).where(eq(contacts.email, user.email))`. Idempotente.
- **Crítico:** o email **nunca** vem do body.
- **Status:** [ ] TODO

### TASK-13: Máquina de 3 passos no `DeleteAccountSection`
- **O quê:** passo 1 email+Turnstile → passo 2 código de 6 dígitos (`verifyOtp`, guardar `access_token` em estado) → passo 3 confirmação explícita → `/waitlist` → `delete-account`. O formulário manual passa a disclosure «Não consigo aceder ao meu email».
- **Design:** vermelho só no botão irreversível do passo 3; teal no resto.
- **Verify:** fluxo completo com conta real, e **confirmar que a linha em `contacts` desapareceu**. Nem a TASK-05 nem a TASK-13 isoladamente apanham o bug de ordenação — só o teste ponta-a-ponta.
- **Status:** [ ] TODO

### TASK-14: Copy e retenções, no mesmo commit da Fase 2
- **O quê:** 10 locales — prazo de «30 dias» → imediato após confirmação; alinhar `pt-pt`, que já foi editada; corrigir a `note` sobre logs (guardamos IP em `rate_limits` e no email ao operador); mencionar a janela de backups do Supabase.
- **Porquê no mesmo commit:** a copy só se torna verdadeira quando o OTP existir.
- **Status:** [ ] TODO

### TASK-11: [repo `app`] Fechar `rate_limits` à role `anon`
- **O quê:** `001_add_security_indexes.sql:44-48` cria duas políticas `USING (true)` **sem cláusula `TO`** → o Postgres assume `TO public`, que inclui `anon`. Qualquer pessoa com a key do APK lê, altera e **apaga** a tabela de rate limiting. Nova migration: `DROP POLICY` das duas, recriar com `TO service_role`.
- **Verify:** `curl` ao PostgREST com a anon key, antes e depois.
- **Status:** [ ] TODO — independente desta feature, deve ser feita de qualquer forma

---

## Fora de scope

- Exportação de dados (Art. 20.º — portabilidade). Obrigação real a prazo, não é o que a Google pede.
- Eliminação parcial de dados · dashboard de gestão de pedidos.
- Framework de testes na landing-page (`package.json` só tem `dev`/`build`/`start`/`lint`).
- Cache partilhado `recipes`/`recipe_translations` com escrita livre a qualquer autenticado (`038a`, `060`) — decisão consciente e documentada, não é `anon`.
- Rotina de limpeza da tabela `rate_limits` — ver *Outras retenções*.

## Open Questions

1. **Palavra de confirmação do passo 3** — traduzida por locale («ELIMINAR»/«DELETE»/…) ou uma só em EN? Traduzida é mais compreensível; fixa é mais simples de validar.
2. **Apple Private Relay** — contas criadas com *Hide My Email* podem não conhecer o `*@privaterelay.appleid.com`. O formulário manual cobre-as, mas testar com uma conta Apple real antes de anunciar o self-service.
3. **Janela de retenção dos backups do Supabase** — qual é o valor real no plano atual? Necessário para a copy da TASK-14.
