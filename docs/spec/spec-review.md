# Revisão dos specs `closed-test-signup.md` e `delete-account.md`

> Data: 2026-09-10 · Método: cada afirmação dos specs confrontada com o código dos dois repos
> (`landing-page`, `app`). Nada aqui é inferido — tudo tem `ficheiro:linha`.

## Veredicto

**Não, as tasks não asseguram todas as funcionalidades pretendidas.** Faltam quatro lacunas funcionais — a eliminação não alcança o Grupo Google (§3.5), a Fase 2 fecha permanentemente a porta ao artigo 21.º sobre a linha `provider` do ledger (§3.6), o formulário que está a ser reescrito não recebe nenhuma das protecções que custaram duas sessões a descobrir (§3.7), e **o `OPERATOR_MAIL_FAILED` da página de eliminação é código morto: a rota devolve 202 mesmo quando o email ao operador não sai** (§2.4). A isso somam-se uma task mal delimitada, que duplicaria um email que já existe (§2.1), e uma lista de ficheiros que omite as duas páginas legais onde a finalidade do tratamento está declarada (§3.4).

O que os specs afirmam sobre arquitectura e segurança — a decisão OTP-vs-magic-link, a ordem `contacts` → `delete-account`, a vulnerabilidade `anon` da TASK-11 — **resistiu a toda a verificação** (§1).

## Baseline no momento da revisão

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | **0 erros** (inclui as edições não commitadas de `pt-pt/deleteAccount.ts` e `pt-pt/emails.ts`) |
| `npm run lint` | **0 erros**, 2 warnings pré-existentes (`page.tsx:8` `TestimonialsSection` por usar, `lib/proxy.ts:11` `supabase` por usar) |

As 10 locales estão em paridade de chaves. A divergência `pt-pt` é de **conteúdo**, não de estrutura.

---

## 1. Afirmações dos specs verificadas e confirmadas

Estas resistiram à verificação — não precisam de mais nada.

| Afirmação | Onde foi confirmada |
|---|---|
| `delete-account` aceita só o `sub` do JWT, nunca o body | `app/supabase/functions/delete-account/index.ts:8-12,38` |
| `verify_jwt = true` nessa função (logo o JWT do utilizador chega verificado) | `app/supabase/config.toml:28-29` |
| A função responde com `Access-Control-Allow-Origin: *` → **o browser em `eatease.eu` pode chamá-la** | `delete-account/index.ts:18` |
| «A app não usa `signInWithOtp` nem magic links; o template *Magic Link* está livre» | `grep signInWithOtp\|magiclink app/src` → **zero ocorrências**; único envio é `resetPasswordForEmail` em `SupabaseAuthService.ts:1125` (o spec cita 1124 — desvio de 1 linha, irrelevante). **TASK-09 é aditiva, não destrutiva.** |
| TASK-11: políticas `USING (true)` sem cláusula `TO` → `PUBLIC` → `anon` | `app/database/migrations/001_add_security_indexes.sql:43-48` — `FOR SELECT USING (true)` e `FOR ALL USING (true)` |
| `trial_ledger` sem FK, RLS ligada, zero políticas, `REVOKE ALL FROM anon, authenticated` | `092_create_trial_ledger.sql:10-31` |
| A poda dos 12 meses existe mesmo (não é só intenção) | `app/supabase/functions/notification-cleanup-cron/index.ts:104-110` |
| `contacts` não precisa de alteração de schema para o teste fechado | `src/db/schema/contacts.ts` — `name/email/locale/confirmed/token/tokenExpiresAt` já lá estão |
| `rate_limits.ip` é `text`, logo o prefixo `del:`/`wl:` não exige migration | `src/db/schema/rateLimits.ts:4`; usado em `rateLimit.ts:20` |

---

**Uma afirmação da TASK-12 que NÃO se confirma:** *«códigos estáveis em todas as respostas»*. O código existe nas respostas de configuração, rate limit, Zod e Turnstile — mas não no caminho que mais importa. Ver §2.4.

---

## 2. Afirmações contraditas pelo código

### 2.1 — `closed-test-signup.md`, TASK-B: **«Hoje o `confirm` só envia o email de boas-vindas ao utilizador»** — falso

`src/app/api/contacts/confirm/route.ts:63-83` já envia **dois** emails, em `Promise.all`:

```ts
const notificationHtml = renderEmail("new-user-confirmation.html", { user_name, user_email, confirmed_at, site_url }, [...]);
resend.emails.send({ to: welcomeEmail, subject: `New signup: ${contact.name}`, ... })   // ← email ao operador
```

O destinatário é `process.env.RESEND_WELCOME_EMAIL` (`confirm/route.ts:51`).

**Consequência para o plano:** TASK-B não é «acrescentar um email», é **«reescrever o conteúdo de `new-user-confirmation.html` e resolver o destinatário»**. Escrita como está, quem a executar cria um segundo envio ao operador e o operador passa a receber dois emails por inscrição. Task reescrita em §3.2.

### 2.2 — `delete-account.md`, tabela de divergência de copy: **correta, mas incompleta**

A tabela audita `emails.deletionRequest.ignore`. Verifiquei as 10 locales:

| Superfície | `pt-pt` | outras 9 |
|---|---|---|
| **Email** `emails.deletionRequest.ignore` | «basta ignorares» ❌ | «responde e nós cancelamos» ✅ *(tabela do spec acerta)* |
| **Página** `deleteAccount.form.successBody` | não tem a frase de todo | **«ignore the email and nothing will happen»** ❌ **nas 9** |

Verbatim (`src/lib/i18n/locales/en/deleteAccount.ts:56`):

> «If you did not make this request, simply ignore the email and nothing will happen.»

E o mesmo em `de`, `es`, `fr`, `it`, `nl`, `pl`, `ro`, `sv` — todas com a construção «ignorar / não acontece nada».

**Consequência para o plano:** o spec conclui que a imprecisão está confinada a `pt-pt` e a difere para a TASK-14 («a copy fica verdadeira quando a Fase 2 for publicada»). Mas **hoje, em produção, nas 9 locales, a própria página diz ao utilizador que ignorar chega** — exactamente a afirmação que o spec identifica como perigosa num pedido malicioso contra terceiro, e exactamente aquela que a mitigação em vigor (`replyTo` → requerente) contradiz. Isto **não pode esperar pela Fase 2**: é uma correcção autónoma. Task nova em §3.1.

*Nota lateral:* o `pt-pt` da página é o único que **omite por completo** a instrução de contestação. Fica pior que os outros nove, não melhor.

### 2.3 — `delete-account.md`, divulgação do trial ledger: **só metade do que a tabela guarda**

O spec e a copy em produção descrevem *«sha256 do email normalizado»*. O ledger guarda **duas** chaves por identidade:

```sql
-- app/database/migrations/093_create_start_trial_rpc.sql:120-123
SELECT 'provider', public.trial_identity_hash(i.provider || ':' || i.provider_id)
  FROM auth.identities i WHERE i.provider <> 'email'
```

`en/deleteAccount.ts:29` divulga apenas *«a technical identifier derived from your email address»*.
Mas `en/privacyPolicy.ts:378` **já divulga as duas**: *«a one-way cryptographic hash of your email address **and of your sign-in provider identifier**»*.

**A página de eliminação está inconsistente com a política de privacidade do próprio site.** Entra na TASK-14 (§3.6).

### 2.4 — **`OPERATOR_MAIL_FAILED` é inalcançável. A página de eliminação devolve 202 sem o email ter saído.**

Este é o achado mais grave da revisão, e sobreviveu a toda a passagem de endurecimento da TASK-12.

`api/account-deletion/route.ts:90-112` protege o envio ao operador com `try/catch`, na convicção de que um `await resend.emails.send()` falhado lança. **Não lança.** O SDK devolve `{ data, error }` e engole tudo:

```js
// node_modules/resend/dist/index.mjs:1071-1124 — fetchRequest()
async fetchRequest(path, options = {}) {
  try {
    const response = await fetch(...);
    if (!response.ok) { ... return { data: null, error: JSON.parse(rawError), ... }; }   // erro da API
    return { data: await response.json(), error: null, ... };
  } catch {
    return { data: null, error: { name: "application_error", statusCode: null,
             message: "Unable to fetch data. The request could not be resolved." }, headers: null };  // erro de rede
  }
}
```

E o tipo confirma-o (`node_modules/resend/dist/index.d.mts:117-125`, `:596`, `:1604`):

```ts
type Response<T> = ({ data: T; error: null } | { error: ErrorResponse; data: null }) & { headers: … };
send(payload: CreateEmailOptions, …): Promise<CreateEmailResponse>;   // = Response<CreateEmailResponseSuccess>
```

**Não há caminho nenhum em que `send()` rejeite** — nem chave de API revogada, nem domínio `from` não verificado, nem 429 da Resend, nem a rede em baixo. O `catch` só apanha o `renderEmail`, que lê o ficheiro com `fs.readFileSync` (`lib/email.ts:22`) — e o envio ao operador nem sequer usa `renderEmail`, monta HTML inline (`route.ts:96-107`). **O `catch` do envio ao operador não apanha absolutamente nada.**

Consequência, exactamente na página com peso legal:

> O utilizador submete o pedido de eliminação → a Resend rejeita → `route.ts:133` devolve **202 `{ ok: true }`** → o `DeleteAccountSection` mostra *«Request received … will be deleted within 30 days»* → **o operador não recebe nada, e ninguém fica a saber.**

O mesmo mecanismo, mais abaixo na cadeia:

| Local | Efeito real |
|---|---|
| `api/contacts/route.ts:106` | 201 devolvido, **email de confirmação nunca enviado**. O utilizador espera por um link que não existe. |
| `api/contacts/confirm/route.ts:70-83` | `Promise.all` **não rejeita**. Redirect limpo para `/confirmed`, `confirmed = true` gravado, **operador não recebe nada**. Um segundo clique cai no early-return de `:30-32` e não reenvia — o pedido de adição ao grupo perde-se em definitivo. |
| `api/account-deletion/route.ts:117-131` | O acuso de recepção é *best-effort* por desenho — aqui o silêncio é intencional e está correcto. |

Isto é uma **segunda explicação candidata** para a lista de espera vazia, ao lado da `TURNSTILE_SECRET_KEY`: se o domínio de envio da Resend alguma vez esteve por verificar, o formulário devolvia 201 e não saía email nenhum. As duas hipóteses distinguem-se pelas datas nos logs da Resend.

**Correcção, em todos os envios que têm de suceder:**

```ts
const { error } = await resend.emails.send({ … });
if (error) {
  console.error("[account-deletion] operator notification failed:", error);
  return fail(502, `OPERATOR_MAIL_FAILED:${error.name}`);
}
```

**Entra como critério de aceitação em:** TASK-17 (`/api/contacts`), TASK-B (`/confirm`), e uma correcção autónoma imediata em `/api/account-deletion` — esta última **não espera pela Fase 2**, está a falhar em silêncio numa página que a Google aceitou como cumprimento de um requisito.

### 2.5 — Link relativo partido

`docs/spec/delete-account.md`, linha 4: `[docs/ideas/account-deletion-page.md](./ideas/account-deletion-page.md)` resolve para `docs/spec/ideas/…` — **não existe**. O ficheiro está em `docs/ideas/`. Correcto: `../ideas/account-deletion-page.md`.

---

## 3. Lacunas de cobertura — tasks novas e reescritas

### 3.1 — TASK-15 (nova, `delete-account`): corrigir a instrução «ignorar» nas 9 locales

**Descrição:** `deleteAccount.form.successBody` diz em 9 locales que ignorar o email basta. Não basta: o pedido fica na caixa do operador de qualquer forma (`api/account-deletion/route.ts:91-108` — o envio ao operador é o mecanismo de eliminação e acontece antes de qualquer coisa). A frase certa é a que já está no email: **responder para cancelar**. `pt-pt` acrescenta a frase que hoje não tem, e o seu `emails.ts` volta a «responde e nós cancelamos» enquanto a Fase 2 não existir.

**Critérios de aceitação:**
- [x] Nenhuma das 10 locales instrui o utilizador a ignorar, em `deleteAccount.form.successBody` nem em `emails.deletionRequest.ignore`.
- [x] `pt-pt` volta a estar alinhada com as outras nove em **ambas** as chaves (prazo e contestação).

**Verificação** (mecânica — despejar os 20 valores e ler cada um):

```bash
for l in de en es fr it nl pl pt-pt ro sv; do
  printf "%-6s PAGE  " "$l"; grep -o 'successBody: "[^"]*"' src/lib/i18n/locales/$l/deleteAccount.ts
  printf "%-6s EMAIL " "$l"; grep -A8 deletionRequest src/lib/i18n/locales/$l/emails.ts | grep -oE 'ignore: *"[^"]*"'
done
```

Os 20 têm de conter a construção «responder para cancelar»; nenhum pode conter «ignorar». Depois: `npx tsc --noEmit` · `npm run lint`
**Dependências:** nenhuma. **Precede** a Fase 2 — corrige produção hoje.
**Ficheiros:** `src/lib/i18n/locales/{10}/deleteAccount.ts`, `src/lib/i18n/locales/{10}/emails.ts`
**Scope:** M (20 ficheiros, uma frase cada)

> **Porque é task separada e não parte da TASK-14:** a TASK-14 só pode ser publicada com a Fase 2, porque anuncia eliminação imediata. Esta é verdadeira hoje e no dia da Fase 2. Amarrá-las mantém a imprecisão em produção durante todo o desenvolvimento da Fase 2, sem ganho nenhum.

---

### 3.2 — TASK-B **reescrita** (`closed-test-signup`): converter a notificação existente

**Descrição:** o email ao operador já existe (`confirm/route.ts:63-82` → `src/templates/new-user-confirmation.html` → `RESEND_WELCOME_EMAIL`). A task é mudar-lhe o conteúdo — passar a ser uma instrução accionável («adicionar `<email>` ao Grupo Google `<endereço>`») — e separar o destinatário do operador do `from:` do email de boas-vindas, que hoje são a mesma variável (§4.3).

**Critérios de aceitação:**
- [x] A confirmação continua a enviar **exactamente dois** emails, não três.
- [x] O email ao operador nomeia o destino — a lista do teste fechado no Play Console, não um Grupo Google, que não chegou a existir — e traz o endereço em texto copiável.
- [x] O destinatário do operador vem de variável própria (`SIGNUP_NOTIFICATION_TO_EMAIL`), distinta do `from:` do email ao utilizador.

**Verificação:** confirmar um contacto em dev e ler as duas mensagens recebidas.
**Dependências:** TASK-D (o endereço do grupo tem de existir para ser nomeado).
**Ficheiros:** `src/app/api/contacts/confirm/route.ts`, `src/templates/new-user-confirmation.html`, `CLAUDE.md` (documentar a variável)
**Scope:** S

---

### 3.3 — TASK-A **alargada** (`closed-test-signup`): a lista de ficheiros está incompleta

TASK-A nomeia `form.ts` e `cta.ts`. Um `grep` por «waitlist» e equivalentes nas 10 línguas devolve mais:

| Ficheiro | Evidência | Porque entra |
|---|---|---|
| `nav.ts` (×10) | `en/nav.ts:5` `joinWaitlist: "Join waitlist"` | é o CTA do cabeçalho, em todas as páginas |
| `hero.ts` (×10) | `en/hero.ts:2` `badge: "Coming soon"` · `:4` `formSubtitle: "Be one of the first to know when we launch"` · `:31` `googlePlayPre: "Coming soon on"` · `:32` `googlePlayAriaLabel: "Coming soon on Google Play"` | com o teste fechado a app **está** no Google Play; «coming soon» passa a falso |
| `pages.ts` (×10) | `en/pages.ts:4` `confirmed.body: "You will be one of the first to know when the App is launched"` | é **a página onde o utilizador aterra** ao clicar no link de confirmação — o sítio mais visível de todos, e nenhuma das tasks lhe toca |
| `privacyPolicy.ts` (×10) | `en/privacyPolicy.ts:36` | ver §3.4 |
| `termsOfUse.ts` (×10) | `en/termsOfUse.ts:23` | ver §3.4 |

Os componentes que consomem estas chaves (`Nav.tsx:146,214`, `AboutSection.tsx:98`, `CtaSection.tsx:61`) usam a âncora `#waitlist` — cosmética, mas se for renomeada tem de ser nos três ao mesmo tempo.

**Critério de aceitação acrescentado:** nenhuma string visível ao utilizador promete «avisamos-te no lançamento»; `pages.confirmed` descreve o que acontece a seguir no teste fechado (convite em ≤24h).
**Scope:** revisto de M para **L** — deve ser partida em A1 (`form`+`cta`+`nav`), A2 (`hero`+`pages`), A3 (legais, §3.4).

---

### 3.4 — TASK-A3 (nova, `closed-test-signup`): a finalidade publicada nos documentos legais

**Descrição:** o spec constrói o seu argumento central sobre **limitação das finalidades** («transformar waitlist em testers seria uma finalidade nova») — e depois não actualiza os dois documentos onde a finalidade está declarada ao titular:

> `en/privacyPolicy.ts:36` — *«our website … allows visitors to **join a waitlist** to gain early access to the application and receive updates and communications regarding the launch»*
> `en/termsOfUse.ts:23` — mesma frase, verbatim.

Se o formulário passa a inscrever testers, estes dois parágrafos passam a descrever um tratamento que já não é o que se faz. O argumento do próprio spec exige que sejam corrigidos **no mesmo commit** que muda a copy do formulário.

**Critérios de aceitação:**
- [x] Ambos os parágrafos descrevem a inscrição no teste fechado, incluindo a partilha do endereço com a Google. **São dois ficheiros, não vinte:** só o `en` tem `privacyPolicy.ts` e `termsOfUse.ts`; as outras nove re-exportam-nos, o que também quer dizer que quem visita o site em português lê-os em inglês.
- [x] A alteração foi no mesmo commit que a TASK-A1.

**Verificação:** `grep -ri "waitlist\|lista de espera\|warteliste\|liste d'attente" src/lib/i18n/locales/*/privacyPolicy.ts src/lib/i18n/locales/*/termsOfUse.ts` → zero · `npm run build`
**Dependências:** TASK-D (saber para onde vai o endereço antes de o declarar).
**Ficheiros:** `src/lib/i18n/locales/{10}/privacyPolicy.ts`, `.../termsOfUse.ts`
**Scope:** M

> **Fundamentação, não suposição:** não estou a afirmar que a lista antiga precisa de novo consentimento — o spec já estabeleceu que a lista está vazia e que isso torna a transição limpa. O que falta é declarar a finalidade **nova** aos titulares **futuros**, que é obrigação independente do estado da lista.

---

### 3.5 — TASK-16 (nova, atravessa os dois specs): a eliminação não alcança o Grupo Google

**Descrição:** esta é a lacuna funcional maior, e não aparece em nenhum dos dois specs.

O `closed-test-signup` põe o endereço do tester num **Grupo Google** (TASK-D) — um sistema de terceiros que passa a guardar dados pessoais sob o mesmo responsável pelo tratamento. Do lado da eliminação:

- `delete-account` TASK-05 apaga a linha em `contacts`;
- a edge function apaga o utilizador de auth;
- **nada remove a adesão ao grupo.**

Um tester que elimine a conta **continua inscrito no teste fechado** e continua a ter acesso à versão de teste na Play Store. E `deleteAccount.whatIsDeleted` (`en/deleteAccount.ts:20`) promete apagar *«Your registration on this website, if you signed up here»* — promessa que deixa de ser verdadeira no instante em que uma linha em `contacts` significa «tester inscrito».

**Critérios de aceitação:**
- [x] O email ao operador (`api/account-deletion/route.ts`) instrui explicitamente a remover o endereço da **lista de testers do Play Console**, em lista numerada, além de apagar o utilizador Supabase e a linha `contacts`.
- [x] ~~Na Fase 2, a remoção tem caminho automático via Directory API (TASK-E)~~ — **não tem, e não terá.** Sem Grupo Google não há API (`edits.testers` não suporta listas de emails), portanto a instrução explícita é a única via. Registado na TASK-13 para o passo 3 da Fase 2 o dizer também ao utilizador.
- [x] `deleteAccount.whatIsDeleted` reflecte o que é, de facto, apagado — passou a nomear a lista de testers, que a promessa «o teu registo neste site» não cobria.
- [x] **O caso em que os dois endereços não coincidem deixou de existir.** A lista do Play Console contém exactamente os endereços que lá pomos, vindos do `contacts` — a mesma chave que o pedido de eliminação traz. A preocupação era válida para um Grupo Google, onde a adesão fica presa à conta Google do tester.

**Verificação:** eliminar uma conta de teste ponta-a-ponta e confirmar no Play Console que o endereço saiu da lista de testers.
**Dependências:** ~~TASK-D~~ — feita. **Já não bloqueia a TASK-13**: a Fase 2 pode prometer eliminação completa porque o passo manual está nomeado no email ao operador. O que a TASK-13 herda é o critério novo abaixo.
**Ficheiros:** `src/app/api/account-deletion/route.ts`, `src/lib/i18n/locales/{10}/deleteAccount.ts`
**Scope:** M

---

### 3.6 — TASK-13 e TASK-14: a Fase 2 fecha a porta ao artigo 21.º sobre a linha `provider`

**Descrição:** `app/docs/TRIAL_LEDGER_DATA_REQUESTS.md` é explícito, e verificado na BD real a 18 AGO 2026:

> «O `sub` do provider vive em `auth.identities`, que desaparece com a conta. Depois disso não há como saber qual das linhas `provider` era daquela pessoa. **Consequência prática:** … Quando possível, tratar o pedido **antes** de apagar a conta.»

Hoje o fluxo manual dá essa janela ao operador — e o email ao operador até o diz (`api/account-deletion/route.ts:105-106`). A **TASK-13 elimina a janela**: eliminação self-service e instantânea, sem operador no meio. Quem entra com Google ou Apple é precisamente o caso em que a linha `provider` existe, e é o caso em que ela se torna permanentemente inalcançável.

Apagá-la preventivamente exigiria `service_role` do projeto da app dentro da landing-page — credencial que o spec rejeita, com razão, em §*Decisões*. Logo a única saída realista é **divulgação no passo 3**.

**Critérios de aceitação acrescentados à TASK-13** — os três cumpridos a 2026-09-13, no commit da TASK-13/14, e guardados por `deleteAccountCopy.test.ts` nas 10 locales:
- [x] O passo 3 avisa, antes do botão irreversível, que a oposição ao registo de trial (art. 21.º) tem de ser pedida **antes** da eliminação, com o endereço de contacto. (`selfService.step3.warningTrial`)
- [x] **O passo 3 diz também que a remoção da lista de testers do teste fechado é manual** e não acontece no instante em que o botão é carregado — a eliminação self-service é imediata na app e na BD, mas o Play Console não tem API que a alcance (TASK-E, impossível). Sem isto, a Fase 2 promete «imediato e completo» sendo imediato e parcial.
**Critério acrescentado à TASK-14:**
- [x] A copy divulga **as duas** chaves do ledger (email e provider), alinhando `deleteAccount.whatRemains` com `privacyPolicy.ts:378`.

**Verificação:** ler o passo 3 nas 10 locales; confirmar que o texto do ledger em `deleteAccount` e em `privacyPolicy` descrevem a mesma coisa.
**Dependências:** nenhuma nova.

---

### 3.7 — TASK-17 (nova, `closed-test-signup`): endurecer `/api/contacts` como se endureceu `/api/account-deletion`

**Descrição:** o `closed-test-signup` nomeia a causa provável da lista vazia — a `TURNSTILE_SECRET_KEY` errada, engolida em silêncio — e depois **não tem nenhuma task que impeça a repetição no formulário que está a reescrever**. Toda a lição da TASK-12 ficou em `/api/account-deletion` e nenhuma foi para `/api/contacts`:

| Protecção | `/api/account-deletion` | `/api/contacts` |
|---|---|---|
| Verificação de configuração antes de tudo | `route.ts:33-41` ✅ | **ausente** |
| `checkRateLimit` em `try/catch` (Supabase frio) | `route.ts:46-54` ✅ | `route.ts:27` — **`await` nu → 500 de corpo vazio** |
| `resend.emails.send` em `try/catch` | `route.ts:90-112` ✅ | `route.ts:106` — **`await` nu** |
| Código estável na resposta | todas ✅ | só no captcha (`route.ts:46`) |
| **A UI mostra o código** | `DeleteAccountSection.tsx:124-125` ✅ | `ContactForm.tsx:48` — **descarta-o, mostra `errorGeneric`** |

A última linha é a decisiva: `/api/contacts` **já devolve** `CAPTCHA_FAILED:invalid-input-secret`, mas o `ContactForm` deita-o fora. Se o `ContactForm` mostrasse o código, o bug de produção teria sido diagnosticado no primeiro relato em vez de ao fim de duas sessões.

**Critérios de aceitação:**
- [x] `/api/contacts` verifica configuração antes do rate limit, e devolve `CONFIG_MISSING_*`. **As variáveis são `RESEND_API_KEY` e `RESEND_FROM_EMAIL` — esta rota nunca lê `RESEND_WELCOME_EMAIL`** (`route.ts:107` usa só `RESEND_FROM_EMAIL`; a outra variável só aparece em `confirm/route.ts:51,72,79`, e é a TASK-B que lhe toca — §4.3).
- [x] `checkRateLimit` em `try/catch` → `DB_UNAVAILABLE`.
- [x] O envio é verificado por **`const { error } = await …; if (error)`**, não por `try/catch` — o SDK não rejeita (§2.4). Devolve `MAIL_FAILED:<error.name>` e **não** 201.
- [x] `ContactForm` mostra o código na mensagem de erro, como o `DeleteAccountSection` faz.

**Verificação:** `curl -X POST .../api/contacts -d '{}'` sem token válido devolve corpo com `code`; simular a chave errada em dev e ver o código no ecrã.
**Dependências:** nenhuma. **Deve ser a primeira task do spec** — é a que faz falhar ruidosamente todas as seguintes.
**Ficheiros:** `src/app/api/contacts/route.ts`, `src/components/ContactForm.tsx`, `src/lib/i18n/locales/{10}/form.ts` (se for preciso texto novo)
**Scope:** M

---

### 3.8 — TASK-18 (nova, `delete-account`): tornar `OPERATOR_MAIL_FAILED` alcançável

**Descrição:** correcção autónoma e imediata do §2.4. A TASK-12 está marcada `[x] COMPLETE` e a `Success Criteria` da Fase 1 dá o formulário por verificado — mas o único modo de falha que a página não consegue reportar é precisamente aquele em que o pedido de eliminação se perde. Corrigir agora; não pertence à Fase 2.

**Critérios de aceitação:**
- [x] `api/account-deletion/route.ts` inspecciona `{ error }` do envio ao operador e devolve `OPERATOR_MAIL_FAILED:<error.name>`; o `try/catch` fica só para o que lança de facto (`renderEmail` → `fs.readFileSync`).
- [x] Nenhum 202 é devolvido sem confirmação de que a Resend aceitou a mensagem.
- [x] O acuso de recepção ao requerente continua *best-effort* — esse silêncio é intencional (`route.ts:114-116`) e mantém-se.

**Verificação:** apontar `RESEND_FROM_EMAIL` para um domínio não verificado em dev; a submissão tem de devolver `OPERATOR_MAIL_FAILED:*` e o ecrã tem de mostrar o código. Confirmar nos logs da Resend que o histórico de envios bate certo com os 202 já devolvidos em produção — é o que distingue as duas hipóteses para a lista vazia (§2.4).
**Dependências:** nenhuma. Precede tudo.
**Ficheiros:** `src/app/api/account-deletion/route.ts`
**Scope:** XS

---

## 4. SOLID e clean code — cada item ligado à task que bloqueia

### 4.1 — `DeleteAccountSection.tsx` já mistura responsabilidades, e a TASK-13 triplica-as → **bloqueia TASK-13**

219 linhas, com o `RequestForm` (linhas 85-219) a acumular: estado da máquina, `fetch`, mapeamento de erros, Turnstile e todo o markup. A TASK-13 acrescenta **três passos**, `verifyOtp`, guarda do `access_token`, e duas chamadas encadeadas com ordem obrigatória. Escrito no mesmo sítio, o ficheiro passa dos 500 e a regra que o spec diz não ser negociável — `contacts` antes de `delete-account` — fica enterrada num `handleSubmit`.

**A fazer dentro da TASK-13, não depois:** `useAccountDeletion()` (hook com a máquina de estados e a sequência das duas chamadas) + `<StepEmail>`, `<StepCode>`, `<StepConfirm>` como sub-componentes de apresentação. A ordem obrigatória fica numa função única e nomeada, legível de relance — que é a única forma de a proteger, dado que o spec reconhece que nem a TASK-05 nem a TASK-13 isoladas apanham o bug de ordenação.

### 4.2 — Pipeline `config → rate limit → zod → turnstile` repetido → **chega à terceira cópia na TASK-04**

`api/contacts/route.ts:24-49` e `api/account-deletion/route.ts:27-76` já são a mesma sequência escrita duas vezes, com protecções diferentes (§3.7 mostra as diferenças). A TASK-04 escreve-a uma terceira vez.

**A fazer antes da TASK-04:** extrair `withRequestGuards({ requiredEnv, rateLimitPrefix, schema })` para `src/lib/apiGuards.ts`, à imagem do que a TASK-01 já fez com `turnstile.ts` e `rateLimit.ts`. A TASK-17 é o momento natural — endurece `/api/contacts` extraindo, em vez de copiar.

### 4.3 — `RESEND_WELCOME_EMAIL` faz dois trabalhos → **bloqueia TASK-B**

`confirm/route.ts:72` usa-a como `from:` do email ao utilizador e `confirm/route.ts:79` como `to:` do email ao operador. São duas moradas com dois propósitos e uma só variável. Além disso:

- Não está documentada em `CLAUDE.md` (a lista de env vars não a menciona — `grep RESEND_WELCOME_EMAIL CLAUDE.md` → 0).
- `confirm/route.ts:51` tolera o vazio (`?? ""`), e o envio a `to: ""` falha em runtime — sem verificação de configuração, e sem `try/catch` (§4.4).

**A fazer na TASK-B:** separar em `RESEND_FROM_EMAIL` (já existe) e `OPERATOR_NOTIFICATION_TO_EMAIL`, e documentar ambas.

### 4.4 — O `confirm` confirma na BD e perde o email do operador em silêncio → **bloqueia TASK-B**

`confirm/route.ts:41-44` grava `confirmed = true`; `confirm/route.ts:70-83` faz `await Promise.all([...])` sem inspeccionar o resultado. Dado o §2.4, **o `Promise.all` não rejeita**: os dois envios podem falhar — e o do operador falha de certeza com `to: ""`, se `RESEND_WELCOME_EMAIL` não estiver definida (`:51` tolera o vazio com `?? ""`) — e a rota redirecciona alegremente para `/confirmed`.

O utilizador vê sucesso. O operador não recebe nada. E o segundo clique no link cai no early-return de `:30-32` (`contact.confirmed === true`) e **não reenvia**: o pedido de adição ao Grupo Google perde-se em definitivo, sem rasto no ecrã de ninguém.

No teste fechado esse email **é** o mecanismo de inscrição — perdê-lo é perder o tester. **A TASK-B tem de cobrir:** `const { error } = await …` em ambos os envios, com o do operador tratado como o que tem de suceder, e uma via de reenvio para quem já está `confirmed` mas nunca foi adicionado ao grupo.

### 4.5 — `escapeHtml` duplicado

`src/lib/email.ts:5-11` (não exportada) e `src/app/api/contacts/confirm/…` via `renderEmail`, mas `api/account-deletion/route.ts:141-147` tem a sua própria cópia idêntica porque monta HTML inline em vez de usar template. Exportar a de `lib/email.ts` e apagar a outra — ou, melhor, dar ao email do operador um template como os outros têm.

### 4.6 — `CONTACT_EMAIL` hardcoded

`DeleteAccountSection.tsx:11` — `const CONTACT_EMAIL = "privacy@eatease.eu"`, renderizado ao utilizador em `:60-63`. O próprio spec tem como *Boundary*: «**Nunca:** hardcodar strings visíveis ao utilizador». Move-se para `deleteAccount.contact.email`.

### 4.7 — `outputFileTracingIncludes` por rota que envia email

`next.config.ts:7-11` lista três rotas. Qualquer rota nova que chame `renderEmail` precisa de entrada própria, ou o template não vai no bundle e falha **só em produção**. A TASK-04 não envia email templado (é o Supabase que envia o OTP), logo não precisa — mas isto pertence ao checklist de verificação de qualquer task que crie uma rota.

### 4.8 — Uma linha cada

- `de` e `fr` tratam por «Sie»/«vous» (formal); `es`, `it`, `nl`, `pt-pt`, `ro` tratam por tu. O `CLAUDE.md` define a voz como «warm, casual, second-person». Escolher e uniformizar — a TASK-15 e a TASK-A tocam nesses ficheiros de qualquer forma.
- `TRIAL_LEDGER_RETENTION_DAYS` tem `365` como *default* (`notification-cleanup-cron/index.ts:104`) e é sobreponível por env; a copy afirma «12 meses» como facto. Confirmar o valor real antes da TASK-14.
- `app/docs/TRIAL_LEDGER_DATA_REQUESTS.md` indica `support@eatease.eu` para o artigo 21.º; a política publicada usa `privacy@eatease.eu` (`en/privacyPolicy.ts:42,272,437,501,721,749`). Alinhar — a publicada manda.
- Link relativo partido em `docs/spec/delete-account.md:4` (§2.5).

---

## 5. Fora de scope — verificado e aceite, não é lacuna

Os dois specs excluem explicitamente, e concordo com a exclusão nos quatro casos:

- Framework de testes — `package.json` tem só `dev`/`build`/`start`/`lint`; introduzi-lo é um projeto por si.
- Rotina de limpeza de `rate_limits` — reconhecida em *Outras retenções*.
- Exportação de dados (art. 20.º) — obrigação real, mas não é o que a Google pede aqui.
- Cache partilhado `recipes` — decisão consciente e documentada, e não é `anon`.

---

## 6. Ordem revista

> **Estado a 2026-09-10:** TASK-18 e TASK-17 concluídas e verificadas. Handoff em [`NEXT.md`](./NEXT.md).

```
TASK-18  { error } no envio ao operador de /api/account-deletion [x] FEITO
TASK-17  endurecer /api/contacts + ContactForm mostra o código   [x] FEITO
── ⚠️ bloqueador novo: closedTestInvite falta em 7 locales, tsc não passa ──
TASK-15  corrigir a instrução «ignorar» nas 10 locales           ← PRÓXIMA
TASK-D   Grupo Google (utilizador)                               ← desbloqueia A3, B, 16
── checkpoint: tsc · lint · build · formulário testado com a chave errada, código visível no ecrã ──
TASK-A1/A2/A3 + TASK-C + TASK-B (+§4.3, §4.4)                    ← um só commit: copy e finalidade mudam juntas
── checkpoint: inscrição ponta-a-ponta, dois emails, /confirmed coerente ──
TASK-11  fechar rate_limits ao anon (repo app)                   ← independente, faz-se de qualquer forma
TASK-09  template Magic Link (utilizador)  ·  TASK-03  ·  TASK-04 (+§4.2)
TASK-05  ·  TASK-13 (+§4.1, +§3.6)  ·  TASK-16
TASK-14  copy da Fase 2 (+ as duas chaves do ledger)             ← mesmo commit da TASK-13
── checkpoint: eliminação ponta-a-ponta; linha em contacts desaparecida; adesão ao grupo removida ──
```

---

## 7. Questões que continuam a ser do utilizador

Estas não se resolvem com código — ficam como estavam nos specs:

1. Nome e endereço do Grupo Google (`testers@eatease.eu`?). **Bloqueia A3, B e 16**, não só a D.
2. Tecto de testers do teste fechado — fechar inscrições ao atingi-lo, ou gerir à mão?
3. Palavra de confirmação do passo 3 — traduzida por locale ou uma só em EN?
4. Janela de retenção dos backups do Supabase no plano actual — necessária para a TASK-14.
5. Emails que não são contas Google — avisar no formulário ou deixar falhar no opt-in?
6. Apple Private Relay — testar com conta real antes de anunciar o self-service.
```
