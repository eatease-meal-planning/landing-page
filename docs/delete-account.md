# Spec: Página pública de eliminação de conta

> **FASE 1 IMPLEMENTADA** (2026-08-31) — conteúdo de conformidade + formulário de pedido, 10 locales, sem qualquer acoplamento ao projeto da app. Falta deploy + submissão (TASK-10).
> **FASE 2 por implementar** — self-service por OTP. Ver *Faseamento* abaixo.
> Direção aprovada em [`docs/ideas/account-deletion-page.md`](./ideas/account-deletion-page.md) · Criado 2026-08-31
> Repo principal: `landing-page` · Repo secundário: `app` (1 migration isolada, TASK-11)

## Retenção do trial ledger — divulgação obrigatória nesta página

A app **retém deliberadamente** um dado que sobrevive à eliminação da conta, e a spec do repo `app` (`docs/specs/TRIAL_REUSE_PREVENTION.md` §4.4) exige que isso seja dito *«no ecrã de eliminação de conta»* — que é exatamente esta página. A primeira versão da copy omitia-o; corrigido nas 10 locales.

Factos, de `database/migrations/092_create_trial_ledger.sql` e `093_create_start_trial_rpc.sql`:

| | |
|---|---|
| O que se guarda | `trial_ledger`: `identity_kind`, `identity_hash`, datas do trial, contador. **sha256 do email normalizado** (minúsculas, trim, `+sufixo` removido) — nunca o email, nunca o `user_id` |
| Porque sobrevive | **sem FK, por desenho** — é o objetivo da tabela. `deleteAuthUser` cascateia tudo o resto; esta fica |
| Retenção | **12 meses** a contar de `trial_end_date` (decisão D-3), depois é podada |
| Finalidade | única: impedir novo trial à mesma identidade. Explicitamente **não** para métricas, marketing ou antifraude genérico |
| Acesso | RLS ativa, **zero políticas**; `REVOKE ALL FROM anon, authenticated`. Só service_role / `SECURITY DEFINER` |
| Base legal | interesse legítimo (considerando 47), **não** uma exceção do Art. 17.º/3 |
| Direito do titular | **Art. 21.º — oposição.** Tem de haver forma de apagar a linha a pedido |

**Duas armadilhas de copy, ambas evitadas:** (a) a spec avisa que o hash é **pseudonimização, não anonimização** — é dado pessoal para nós porque conseguimos recalculá-lo para qualquer email candidato; a copy não lhe chama anónimo. (b) Sendo interesse legítimo, o direito de oposição tem de estar visível — a copy diz que basta escrever para `privacy@eatease.eu`.

> **Consequência operacional:** o `privacy@eatease.eu` passa a receber dois tipos de pedido — eliminação de conta e oposição ao ledger. O segundo resolve-se com uma consulta por hash em `service_role` (§4.5 da spec da app).

## Faseamento

O que a Google valida ao gravar o formulário é que **o URL responde e descreve o processo**. A redação é *«pedir a eliminação»* — um formulário que **regista um pedido** cumpre-a. O self-service por OTP é melhoria de qualidade, não requisito de submissão, e é a parte que precisa do Dashboard e de uma conta real da app para testar. Daí a divisão:

| | Fase 1 — **feito** | Fase 2 — por fazer |
|---|---|---|
| Conteúdo de conformidade, 10 locales | ✅ | — |
| Formulário de pedido + Turnstile + rate limit + Resend | ✅ | — |
| Dependências externas | **nenhuma** | Dashboard Supabase, anon key da app |
| Eliminação | manual, pelo operador | self-service imediato |

**Correção à arquitetura original.** A spec inicial amarrava a eliminação da linha em `contacts` à autenticação da **conta da app**. Está errado: quem só existe em `contacts` e nunca criou conta na app não recebe código nenhum (`shouldCreateUser: false`) e ficaria sem forma de se apagar — precisamente a lacuna do Art. 17 que a página existe para fechar. Na Fase 2, as duas eliminações precisam de **duas provas independentes de posse do email**:

| Dado | Prova | Infraestrutura |
|---|---|---|
| Conta da app (`auth.users` + cascatas) | OTP contra o projeto da app | `signInWithOtp` + edge function |
| Linha em `contacts` | Token emitido pela própria landing-page | já existe: `contacts.token` + `tokenExpiresAt` |

Na Fase 1 isto não se põe: o operador verifica a identidade e trata das duas.

## Assumptions

Explícitas, para correção imediata:

1. O link submetido ao Play Console é `https://www.eatease.eu/delete-account` — **sem locale**. O apex `eatease.eu` já é encaminhado para `www` no Vercel (confirmado pelo utilizador), portanto o apex faz dois saltos e o `www` faz um.
2. A landing-page **nunca** acede à base de dados do projeto da app. Fala com Supabase Auth + a edge function `delete-account`, ambos do projeto `dagpiagorabmliuotkoc`.
3. A landing-page **apaga** a linha em `contacts` (DB própria) no mesmo fluxo, porque é o mesmo responsável pelo tratamento.
4. O template *Magic Link* do projeto da app está livre e passa a entregar um código de 6 dígitos (`{{ .Token }}`).
5. Não há framework de testes neste repo (`package.json` só tem `dev`/`build`/`start`/`lint`). A verificação é `tsc` + `lint` + `build` + validação manual. Introduzir Jest/Vitest está **fora** do scope desta feature.

**Regras de domínio EatEase verificadas e não aplicáveis:** imutabilidade de planos de refeições, invariante de macros por dose, fronteira de tradução de receitas, dados standard em favoritos, e feature gating por subscrição — nenhuma toca nesta feature, que é uma página pública de conformidade sem conteúdo nutricional. **Aplicável:** i18n obrigatório nas 10 locales.

## Objective

Dar a um utilizador — possivelmente já sem a app instalada — um URL público onde prove que é ele e elimine a conta e os dados associados, satisfazendo em simultâneo o requisito do Google Play Console (*Adicione um link que os utilizadores podem usar para pedir a eliminação da respetiva conta e dos dados associados*) e o direito ao apagamento do RGPD (Art. 17).

**User stories:**
- Como utilizador que desinstalou a app, abro o link da ficha do Play Store e elimino a conta sem reinstalar nada.
- Como utilizador que ainda tem a app, vejo na página que também o posso fazer em Definições → Mais.
- Como utilizador que perdeu o acesso ao email da conta, tenho um caminho humano para pedir a eliminação.
- Como revisor do Google, abro o URL sem login e vejo que dados são apagados, quais ficam e em quanto tempo.

## Tech Stack (landing-page)

- Next.js 16 App Router · React 19 · TypeScript · Tailwind v4
- i18n próprio: dicts por locale em `src/lib/i18n/locales/{locale}/`, tipo derivado de `en`
- Drizzle ORM + Postgres (Supabase) — **projeto da landing-page**
- `@supabase/supabase-js` — **projeto da app**, para Auth + Edge Function
- Resend (email) · Cloudflare Turnstile (já instalado e em uso)

## Commands

```bash
npx tsc --noEmit     # 0 erros exigidos
npm run lint         # ESLint
npm run build        # build de produção
```

> O servidor de dev é corrido pelo utilizador num terminal próprio — não arrancar `npm run dev`.

## Arquitetura

**Fase 1 — o que está implementado:**

```
GET  /delete-account                    → proxy.ts redireciona p/ /{locale}/delete-account
GET  /[lang]/delete-account             → Server Component: Nav + DeleteAccountSection + Footer
                                          (conteúdo de conformidade sempre visível, sem login)
POST /api/account-deletion              → Zod + rate limit `del:${ip}` + Turnstile
                                          → Resend p/ operador (DELETION_REQUEST_TO_EMAIL,
                                            replyTo = requerente) — é o que faz a eliminação acontecer
                                          → Resend p/ requerente: acuso de receção na locale da página,
                                            com instrução de responder se não foi ele
                                          → 202. Nada é escrito na DB, nada é destruído aqui.
```

**Fase 2 — desenho alvo corrigido (2026-08-31).**

O problema central: quem só existe em `contacts` e nunca criou conta na app **não recebe OTP nenhum** (`shouldCreateUser: false`), e distinguir os dois casos na resposta seria um oráculo de enumeração. Solução: **um pedido, duas provas independentes, emitidas em paralelo**. O handler dispara ambas e responde sempre o mesmo; o utilizador segue o que lhe chegar.

```
POST /api/account-deletion/request   (Turnstile + rate limit `del:${ip}`)
  ├─ signInWithOtp({shouldCreateUser:false})   → só chega a quem TEM conta na app
  └─ se existir linha em contacts:
       token próprio da landing-page + email com link de eliminação
  → resposta CONSTANTE: "se houver algo neste endereço, enviámos instruções"

Caminho A — conta da app          Caminho B — só contacts
  verifyOtp → access_token          clica no link → token válido?
  ↓                                 ↓
  DELETE contacts (Bearer)          DELETE contacts
  ↓                                 (fim — não há conta a apagar)
  POST delete-account (Bearer)
  (irreversível — sempre o último)
```

**Porque não há atalho.** Apagar a conta da app exige um JWT daquele utilizador do projeto da app. A landing-page não o consegue fabricar, e a alternativa — dar-lhe a `service_role` do projeto da app, ou criar uma edge function `delete-account-by-email` com segredo partilhado — troca uma prova de posse do email por uma chave que apaga qualquer conta. Não compensa: o OTP é a prova, e é gratuita.

**Diagrama original (mantido para referência da parte OTP):**

```
POST /api/account-deletion/request      → Turnstile + rate limit + signInWithOtp (server-side)
                                          resposta SEMPRE constante (anti-enumeração)
     [browser] verifyOtp                → sessão do projeto da app, access_token em memória
POST /api/account-deletion/waitlist     → Bearer <access_token>; o handler valida o token
                                          contra o projeto da app, extrai o email do
                                          utilizador e apaga a linha em contacts
                                          ⚠️ TEM de vir ANTES da eliminação da conta
POST <app>/functions/v1/delete-account  → browser → edge function, Bearer <access_token>
                                          (irreversível — sempre o último passo)
POST /api/account-deletion/manual       → fallback humano: Turnstile + rate limit + Resend
```

### Decisões e as suas razões

**Porquê código de 6 dígitos e não magic link.** A app não usa `signInWithOtp` nem magic links — só `resetPasswordForEmail` (`SupabaseAuthService.ts:1124`), que usa o template *Reset Password*. O template *Magic Link* está livre. Ganhos: dispensa a allow-list de Redirect URLs; imune a scanners corporativos (Outlook Safe Links) que consomem o token antes do clique; fluxo num único separador.

**Porquê o pedido de OTP no route handler.** Precisão importante: **o Turnstile no route handler não protege o endpoint OTP do Supabase** — um atacante chama `dagpiagorabmliuotkoc.supabase.co/auth/v1/otp` diretamente com a key do APK. O que o handler compra é (a) proteger a *nossa* página e a *nossa* reputação de entrega de email contra abuso casual, e (b) um sítio onde tornar a resposta constante. O backstop real do endpoint upstream são os rate limits de auth do próprio Supabase. A alternativa — captcha nativo do Supabase Auth — é *project-wide* e passaria a exigir `captchaToken` no `signInWithPassword` da app em produção: breaking change, descartada.

**Porquê capturar o `access_token` do retorno do `verifyOtp`.** O cliente do projeto da app usa `persistSession: false` para não deixar sessão da app no `localStorage` de `eatease.eu`. Como consequência, não se pode depender do estado interno do cliente entre interações. `verifyOtp` devolve `{ data: { session } }` — guardar `data.session.access_token` em estado do componente e passá-lo explicitamente como Bearer nos passos seguintes. É a versão que não parte num remount.

**Porquê `del:${ip}` como chave de rate limit.** `rate_limits.ip` é `text` (PK simples) e é partilhado com `/api/contacts`. Prefixar a chave dá orçamento separado aos dois endpoints sem alterar o schema — caso contrário, martelar a eliminação bloquearia o formulário da waitlist para aquele IP.

**Porquê validar o token no `/waitlist` em vez de confiar no email enviado pelo cliente.** Aceitar um email do body permitiria a qualquer pessoa apagar a linha de waitlist de terceiros. O handler faz `getUser(access_token)` contra o projeto da app e usa o email que vem de lá.

**Porquê o `/waitlist` corre ANTES do `delete-account`.** Consequência direta da decisão acima: `getUser(token)` resolve o `sub` contra `auth.users`. Depois de a edge function apagar o utilizador, esse `sub` já não existe — o GoTrue devolve *"User from sub claim in JWT does not exist"*, o handler devolve 401 e a linha em `contacts` nunca é apagada. A assinatura do token continua válida; é a resolução do utilizador que falha. E o utilizador não pode voltar a tentar, porque já não consegue autenticar-se numa conta eliminada: a linha ficaria **permanentemente inapagável** por este fluxo — exatamente a lacuna do Art. 17 que a sua eliminação vem fechar. Ordem correta: primeiro o passo reversível e idempotente, depois o irreversível. Bónus: se o `/waitlist` falhar, aborta-se antes de destruir seja o que for.

## i18n Scope

- Novo dict: `deleteAccount` em `src/lib/i18n/locales/{locale}/deleteAccount.ts`, exportado no `index.ts` de cada locale.
- Padrão a seguir: **`form`/`pages`** (traduzido nas 10 locales), **não** `legal.englishNotice` (inglês-only). Isto é UI funcional e conteúdo de conformidade que a pessoa tem de compreender antes de destruir dados de forma irreversível.
- Nova chave no dict `footer`: `deleteAccount`.
- Novo bloco em `emails`: `deletionRequest` (para o fallback manual).
- **Constraint dura:** `dictionaries.ts` tipa cada loader como `() => Promise<Translations>` e `Translations = typeof en`. Acrescentar `deleteAccount` a `en/index.ts` faz o `tsc` falhar nas outras nove locales até todas terem a chave. Por isso **as 10 locales têm de ser feitas na mesma task** — separá-las deixaria o repo sem compilar entre tasks.

Chaves necessárias (estrutura):

```
deleteAccount: {
  title, intro,
  whatIsDeleted: { title, items[] },
  whatRemains:   { title, items[], note },
  timing:        { title, body },
  inApp:         { title, body },
  step1: { title, emailLabel, emailPlaceholder, submit, sent },
  step2: { title, codeLabel, codePlaceholder, submit, resend, invalidCode },
  step3: { title, warning, confirmWord, confirmLabel, submit, deleting },
  success: { title, body },
  errors:  { generic, rateLimited, captcha, expired },
  fallback: { trigger, title, body, submit, sent },
  contact: { title, body, email },
}
```

## Boundaries

- **Sempre:** `npx tsc --noEmit` + `npm run lint` + `npm run build` antes de dar uma task por concluída.
- **Perguntar primeiro:** alterações ao schema Drizzle da landing-page; nova dependência npm; qualquer alteração no repo `app` além da migration da TASK-11.
- **Nunca:** hardcodar strings visíveis ao utilizador — tudo pelos dicts.
- **Nunca:** aceitar o email do body para decidir o que apagar — só o que vier de um token validado.
- **Nunca:** devolver resposta diferente para email existente vs. inexistente no `/request`.
- **Nunca:** ler `.env`/`.env.local` — pedir ao utilizador o estado das variáveis.

## Success Criteria

- [ ] `https://www.eatease.eu/delete-account` responde 307 → `/{locale}/delete-account` conforme `Accept-Language`.
- [ ] A página carrega sem login e mostra: nome da app, dados apagados, dados retidos, prazo, alternativa in-app, contacto humano.
- [ ] O seletor de idioma da Nav mantém a página ao mudar de locale (✅ já feito).
- [ ] Um utilizador com conta consegue: email → código → confirmação → conta eliminada, e o `GET /auth/v1/user` com aquele token passa a falhar.
- [ ] A linha correspondente em `contacts` é removida no mesmo fluxo.
- [ ] Um email sem conta recebe **exatamente** a mesma resposta que um email com conta.
- [ ] O fallback manual envia email ao utilizador e ao operador.
- [ ] Renderiza corretamente nas 10 locales.
- [ ] `npx tsc --noEmit` 0 erros · `npm run lint` limpo · `npm run build` passa.

---

# Tasks

Ordenadas por dependência: helpers → i18n → clientes → route handlers → UI → página → config.

### TASK-01: Extrair helpers partilhados de `/api/contacts`
- **Ficheiros:** `src/lib/turnstile.ts` (novo), `src/lib/rateLimit.ts` (novo), `src/app/api/contacts/route.ts`
- **O quê:** mover `verifyTurnstile`, `getClientIp` e `checkIpRateLimit` para `src/lib/`. `checkIpRateLimit` passa a aceitar `(key: string)` em vez de `(ip: string)` para suportar o prefixo `del:`. `/api/contacts` passa a importar em vez de definir.
- **Também:** remover o `console.log` em `route.ts:27` que expõe o comprimento e os 4 primeiros/últimos chars do `TURNSTILE_SECRET_KEY`.
- **Acceptance:** `/api/contacts` mantém comportamento idêntico; nenhum segredo em logs.
- **Verify:** `npx tsc --noEmit` · `npm run lint` · submeter o formulário da waitlist em dev e confirmar que ainda funciona.
- **Status:** [x] COMPLETE — `src/lib/turnstile.ts` + `src/lib/rateLimit.ts` criados; `/api/contacts` importa-os e usa a chave `wl:${ip}`; `console.log` do segredo removido.

### TASK-02: Dict `deleteAccount` nas 10 locales
- **Ficheiros:** `src/lib/i18n/locales/{de,en,es,fr,it,nl,pl,pt-pt,ro,sv}/deleteAccount.ts` (10 novos) + os 10 `index.ts` + chave `deleteAccount` no dict `footer` das 10 locales
- **O quê:** estrutura acima. `en` primeiro como canónica, restantes traduzidas. **Uma só task** — o `Translations = typeof en` faz o `tsc` falhar enquanto faltar uma locale.
- **Acceptance:** `getDictionary(l).deleteAccount` resolve para as 10 locales, sem chaves em falta.
- **Verify:** `npx tsc --noEmit` (é o teste real aqui — o tipo garante paridade de chaves).
- **Status:** [x] COMPLETE — `deleteAccount.ts` nas 10 locales, ligado aos 10 `index.ts`; chave `footer.deleteAccount` nas 10; bloco `emails.deletionRequest` nas 10.

### TASK-03: Clientes Supabase do projeto da app
- **Ficheiros:** `src/lib/appSupabase.ts` (novo)
- **O quê:** duas factories com `createClient` de `@supabase/supabase-js` (não `@supabase/ssr` — esse é para o projeto da landing-page), ambas com `auth: { persistSession: false, autoRefreshToken: false }`:
  - `appSupabaseServer()` — para os route handlers.
  - `appSupabaseBrowser()` — singleton ao nível do módulo, para o componente.
  - Constante exportada `APP_FUNCTIONS_URL` = `${NEXT_PUBLIC_APP_SUPABASE_URL}/functions/v1`.
- **Acceptance:** nenhuma sessão do projeto da app escrita em `localStorage` de `eatease.eu`.
- **Verify:** `npx tsc --noEmit` · DevTools → Application → Local Storage vazio de chaves `sb-dagpia*`.
- **Status:** [ ] TODO — **FASE 2**

### TASK-04: Route handler `POST /api/account-deletion/request`
- **Ficheiros:** `src/app/api/account-deletion/request/route.ts` (novo)
- **O quê:** Zod (`email`, `cfTurnstileToken`) → `checkIpRateLimit('del:' + ip)` → `verifyTurnstile` → `appSupabaseServer().auth.signInWithOtp({ email, options: { shouldCreateUser: false } })`.
- **Crítico:** ignorar o resultado do `signInWithOtp` para efeitos de resposta. Devolver **sempre** `{ ok: true }` 200, exista ou não a conta. Só falhas de captcha (400) e rate limit (429) devolvem outra coisa. Registar o erro real com `console.error`, nunca no body.
- **Acceptance:** `curl` com email existente e com email inexistente devolvem bytes idênticos **e tempos de resposta comparáveis**. Bytes iguais não bastam: `signInWithOtp` num email existente envia mesmo o email e demora visivelmente mais, o que é por si só um oráculo de enumeração. Disparar o `signInWithOtp` sem `await` (fire-and-forget, com `.catch(console.error)`) e responder de imediato.
- **Verify:** `npx tsc --noEmit` · dois `curl -w '%{time_total}'` comparados com `diff` no corpo e com os tempos na mesma ordem de grandeza.
- **Status:** [ ] TODO — **FASE 2**

### TASK-05: Route handler `POST /api/account-deletion/waitlist`
- **Ficheiros:** `src/app/api/account-deletion/waitlist/route.ts` (novo)
- **O quê:** lê `Authorization: Bearer <access_token>` → `appSupabaseServer().auth.getUser(token)` → se inválido, 401 → `db.delete(contacts).where(eq(contacts.email, user.email))`.
- **Crítico:** o email **nunca** vem do body. Devolver 200 mesmo quando não existia linha (idempotente).
- **Acceptance:** um token forjado ou expirado devolve 401 e não apaga nada.
- **Verify:** `npx tsc --noEmit` · testar com token válido, token inválido, e email sem linha em `contacts`.
- **Status:** [ ] TODO — **FASE 2**

### TASK-06: Fallback manual — route handler + template + copy
- **Ficheiros:** `src/app/api/account-deletion/manual/route.ts` (novo), `src/templates/deletion-request.html` (novo), bloco `emails.deletionRequest` nas 10 locales
- **O quê:** Zod (`email`, `reason?`, `cfTurnstileToken`) → rate limit `del:` → Turnstile → Resend: um email ao utilizador a confirmar a receção do pedido, outro ao operador com os dados para processar à mão. Usa `renderEmail()` de `src/lib/email.ts`.
- **Acceptance:** ambos os emails chegam; o do utilizador vai na locale da página.
- **Verify:** `npx tsc --noEmit` · submeter em dev e confirmar as duas entregas no dashboard do Resend.
- **Status:** [x] COMPLETE (adaptado) — handler em `/api/account-deletion` (não `/manual`: na Fase 1 é o único caminho). `src/templates/deletion-request.html` derivado do template de confirmação.

### TASK-07: `DeleteAccountSection` (Client Component)
- **Ficheiros:** `src/components/landing/DeleteAccountSection.tsx` (novo)
- **O quê:** recebe `t: Translations["deleteAccount"]` e `locale` por props — sem strings hardcoded. Máquina de estados de 3 passos:
  - **Passo 1** — email + `<Turnstile>` (padrão de `ContactForm.tsx:111-116`) → `POST /api/account-deletion/request`. Mensagem neutra: "se existir conta, enviámos um código".
  - **Passo 2** — input de 6 dígitos → `appSupabaseBrowser().auth.verifyOtp({ email, token, type: 'email' })` → guardar `data.session.access_token` em estado.
  - **Passo 3** — aviso de irreversibilidade + o utilizador escreve a palavra de confirmação → **(a)** `POST /api/account-deletion/waitlist` com Bearer → **(b)** só depois `POST ${APP_FUNCTIONS_URL}/delete-account` com o mesmo Bearer → ecrã de sucesso. **A ordem não é negociável** (ver *Decisões*): depois de (b) o token deixa de resolver um utilizador e (a) devolveria 401 para sempre. Se (a) falhar, abortar e mostrar erro — não avançar para (b).
  - **Fallback** — disclosure "Não consigo aceder ao meu email" → formulário → `POST /api/account-deletion/manual`.
- **Design system:** botão de destruição é a única exceção ao teal — usar vermelho para a ação irreversível do passo 3, teal para os passos 1-2. Cartões `rounded-lg` + `shadow-card`, sem borda.
- **Acceptance:** a secção informativa (dados apagados/retidos/prazo/in-app/contacto) está **sempre** visível, acima e independente da máquina de estados.
- **Verify:** `npx tsc --noEmit` · `npm run lint` · percorrer os 3 passos em dev com uma conta de teste real e **confirmar, no fim do fluxo completo, que a linha em `contacts` desapareceu**. Nem a verificação da TASK-05 nem a da TASK-07 isoladamente apanham o bug de ordenação — só o teste ponta-a-ponta.
- **Status:** [x] COMPLETE (Fase 1) — `DeleteAccountSection.tsx` com conteúdo sempre visível + formulário. A máquina de 3 passos com OTP é Fase 2.

### TASK-08: Página `/[lang]/delete-account` + link no footer
- **Ficheiros:** `src/app/[lang]/delete-account/page.tsx` (novo), `src/components/landing/Footer.tsx`
- **O quê:** seguir exatamente o padrão de `src/app/[lang]/privacy-policy/page.tsx` — `generateMetadata` com título traduzido, `Nav` + secção + `Footer`. Sem `generateStaticParams`, igual às restantes páginas: a rota é dinâmica por locale e a interatividade vive no Client Component. Adicionar `<a href={`/${locale}/delete-account`}>` na coluna *Support* do footer, a seguir a *Cookies*.
- **Acceptance:** `/pt-pt/delete-account` e as outras 9 renderizam; `/delete-account` redireciona conforme `Accept-Language`.
- **Verify:** `npm run build` · `curl -H 'Accept-Language: de' -I localhost:3000/delete-account` devolve `Location: /de/delete-account`.
- **Status:** [x] COMPLETE — `src/app/[lang]/delete-account/page.tsx` + link na coluna *Support* do `Footer.tsx`.

### TASK-09: Configuração Supabase (Dashboard, projeto `dagpiagorabmliuotkoc`)
- **O quê:** Auth → Email Templates → **Magic Link**: confirmar que não está em uso e trocar o corpo para entregar `{{ .Token }}` (código de 6 dígitos) com copy própria de eliminação de conta, não copy genérica de login. Rever os rate limits de auth (Auth → Rate Limits) para o envio de OTP.
- **Acceptance:** o email recebido mostra um código de 6 dígitos e menciona eliminação de conta.
- **Verify:** pedir um código em dev e ler o email recebido.
- **Status:** [ ] TODO — **requer acesso ao Dashboard (utilizador)** — **FASE 2**

### TASK-10: Variáveis de ambiente + submissão
- **O quê:** adicionar ao `.env.local` e ao Vercel (Production + Preview):
  - `NEXT_PUBLIC_APP_SUPABASE_URL=https://dagpiagorabmliuotkoc.supabase.co`
  - `NEXT_PUBLIC_APP_SUPABASE_ANON_KEY=<anon key do projeto da app>`
  - `DELETION_REQUEST_TO_EMAIL=<destinatário dos pedidos manuais>`
  - Documentar as três no `CLAUDE.md`, secção *Environment Variables*.
  - Submeter `https://www.eatease.eu/delete-account` no Play Console **e** no formulário *Data safety*.
- **Verify:** deploy de produção; abrir o URL em anónimo com `Accept-Language` diferentes.
- **Status:** [ ] TODO — **requer acesso ao Vercel e ao Play Console (utilizador)**

### TASK-11: [repo `app`] Fechar `rate_limits` à role `anon`
- **Ficheiros:** `database/migrations/0XX_fix_rate_limits_rls.sql` (novo, no repo `app`)
- **O quê:** `DROP POLICY` das duas políticas de `001_add_security_indexes.sql:44-48` e recriar com `TO service_role`. Sem cláusula `TO`, o Postgres assume `TO public`, que inclui `anon` — qualquer pessoa com a key do APK pode ler, alterar e **apagar** a tabela de rate limiting.
- **Acceptance:** um cliente com a anon key recebe 0 linhas em `SELECT` e falha o `DELETE` em `rate_limits`.
- **Verify:** `curl` ao PostgREST com a anon key antes e depois.
- **Status:** [ ] TODO — independente desta feature, deve ser feita de qualquer forma

---

## Fora de scope

- Exportação de dados (RGPD Art. 20 — portabilidade). Obrigação real a prazo, mas não é o que a Google pede agora.
- Eliminação parcial de dados.
- Dashboard de gestão de pedidos manuais.
- Introduzir framework de testes na landing-page.
- Correção do cache partilhado `recipes`/`recipe_translations` (escrita livre a qualquer autenticado) — registado no one-pager, não urgente, não é `anon`.

## Open Questions

1. **Email de contacto humano** — `privacy@eatease.eu`, `support@eatease.eu`, ou o que consta na privacy policy? Tem de ser consistente com o que lá está. Bloqueia a copy da TASK-02.
2. ~~**`iap_receipt_log` e `subscriptions` são apagadas**~~ — **RESOLVIDA (2026-08-31).** Confirmado: ambas cascateiam (`051:11`, `048:11`) e o registo fiscal de referência é o da Google/Apple. Mas a investigação expôs uma retenção que **faltava divulgar** — ver *Retenção do trial ledger* abaixo.
3. **Palavra de confirmação do passo 3** — traduzida por locale ("ELIMINAR"/"DELETE"/…) ou uma só palavra em EN para todos? Traduzida é mais compreensível; fixa é mais simples de validar.
4. **Apple Private Relay** — utilizadores que criaram conta com *Hide My Email* podem não conhecer o `*@privaterelay.appleid.com`. O fallback manual cobre-os, mas convém testar com uma conta Apple real antes de submeter.
