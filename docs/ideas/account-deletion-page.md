# Página pública de eliminação de conta (Google Play Console)

> Estado: **direção aprovada, por implementar** · Criado 2026-08-31
> Repos envolvidos: `landing-page` (principal) · `app` (1 migration isolada)

## Problem Statement

**How Might We** dar a um utilizador Android — possivelmente já com a app desinstalada — um URL público, sem login prévio, onde ele prove que é ele e elimine a conta + dados associados, **sem acoplar a landing-page à base de dados da app**?

## A premissa que estava errada (e porquê isso simplifica tudo)

A landing-page não precisa de ligação à DB da app. O que já existe no repo `app`:

| Facto | Onde |
|---|---|
| Edge function de hard-delete, irreversível, sem grace period (decisão D-5) | `supabase/functions/delete-account/index.ts` |
| `Access-Control-Allow-Origin: *` + handler de `OPTIONS` → **já chamável de outro domínio** | `index.ts:17-21` |
| `verify_jwt = true` — assinatura validada pela gateway antes da função correr | `supabase/config.toml:28-29` |
| Conta a apagar vem do claim `sub`, **nunca do body** | `delete-account/auth.ts:23-32` |
| Apagar o auth user cascateia todas as tabelas (FK `ON DELETE CASCADE`) + limpa Storage | `delete-account/db.ts` |
| Caminho in-app já existe e está traduzido nas 10 locales | `MoreScreen.tsx` → `services/api/deleteAccountClient.ts` |

A landing-page fala com **Supabase Auth + a edge function**, nunca com a base de dados. Zero acoplamento de dados, zero código de servidor novo do lado da app.

## Análise de segurança da anon key (dúvida levantada, resolvida)

**Pode alguém apagar a conta de outro com a anon key? Não.** Três barreiras independentes:

1. `verify_jwt = true` → forjar um `sub` arbitrário exige o **JWT secret** do projeto, não a anon key.
2. `getUserIdFromJwt` lê exclusivamente o `sub` do token; o body nunca é fonte deste valor.
3. A anon key não tem `sub` (payload = `{iss, ref, role:"anon", iat, exp}`) → `getUserIdFromJwt` devolve `null` → **401 `UNAUTHENTICATED`**.

Apagar uma conta exige um **access token de sessão do próprio utilizador**, ou seja, ter passado pelo código enviado para o email dele.

**Pode alguém destruir a DB com a anon key? Não** — 31 tabelas com RLS ativa, políticas maioritariamente `auth.uid() = user_id` ou `TO authenticated`. **Uma exceção real** (ver task separada abaixo).

**Ponto decisivo:** a anon key **já vai em claro dentro do APK** submetido ao Play Console. Publicá-la na landing-page adiciona **zero** superfície de ataque nova. O risco genuinamente novo de uma página pública é outro — enumeração de emails e email bombing — e mitiga-se com Turnstile, não escondendo a key.

## Recommended Direction

Página híbrida em `/[lang]/delete-account`: **self-service com código de 6 dígitos** como caminho principal, **formulário de pedido humano** como fallback.

```
/[lang]/delete-account                     (público, sem login, 10 locales)
│
├─ Conteúdo sempre visível (requisito Play Console)
│    ├─ Nome da app: EatEase
│    ├─ Que dados são apagados / que dados ficam
│    ├─ Prazo: imediato e irreversível
│    ├─ Alternativa in-app: Definições → Mais
│    └─ Contacto humano (GDPR Art. 17)
│
├─ Passo 1 — email + Turnstile
│    └─ POST /api/account-deletion/request   (Next route handler)
│         ├─ verifyTurnstile()               ← reutiliza src/app/api/contacts/route.ts:24
│         ├─ checkIpRateLimit()              ← reutiliza tabela rate_limits
│         └─ Supabase Auth signInWithOtp({ shouldCreateUser: false })  [server-side]
│
├─ Passo 2 — utilizador escreve o código de 6 dígitos na MESMA página
│    └─ browser: supabase.auth.verifyOtp({ email, token, type: 'email' })
│
├─ Passo 3 — ecrã de confirmação explícita ("escreve ELIMINAR")
│    ├─ browser: POST .../functions/v1/delete-account  (Bearer <access token>)
│    └─ + POST /api/account-deletion/waitlist  → apaga a linha em contacts (projeto da landing-page)
│
└─ Fallback: "Não consigo aceder ao meu email"
     └─ form → Resend → pedido manual (padrão double opt-in já existente)
```

**Porquê código de 6 dígitos e não magic link.** Confirmado por grep: a app **não usa `signInWithOtp` nem magic links** — apenas `resetPasswordForEmail` (`SupabaseAuthService.ts:1124`), que usa o template *Reset Password*. O template **Magic Link está livre** → muda-se para `{{ .Token }}` sem afetar a app. Ganhos: (a) elimina a dependência da allow-list de Redirect URLs; (b) imune a scanners corporativos tipo Outlook Safe Links que consomem o token antes de o utilizador clicar; (c) fluxo num único separador, o que importa para quem já desinstalou a app.

**Ajuste ao que foi escolhido, e porquê.** Se o `signInWithOtp` fosse feito no browser, **nenhum Turnstile server-side o poderia proteger** — o atacante salta a página e chama `dagpiagorabmliuotkoc.supabase.co` diretamente com a key do APK. As duas únicas formas reais de impor captcha nesse passo são (1) o captcha nativo do Supabase Auth, que é **project-wide** e passaria a exigir `captchaToken` no `signInWithPassword` da app — breaking change numa app em produção; ou (2) **o pedido de OTP ser feito pelo route handler**, mantendo tudo o resto no browser. Adotámos (2). Os passos 2 e 3 continuam no browser com a anon key, como escolhido.

## URL a submeter ao Play Console

Submeter o **path sem locale**, não `/en/delete-account`:

```
https://www.eatease.eu/delete-account
```

O middleware (`src/proxy.ts:11-21`) redireciona qualquer path sem prefixo de locale para `/{localeDetetado}{path}` a partir do `Accept-Language`, e o matcher só exclui `_next|api|favicon.ico|site.webmanifest|images|icons|assets` — portanto `/delete-account` entra na regra. Resultado: um URL estável e sem `[lang]`, com cada utilizador a aterrar na sua língua (fallback `en` para idiomas não suportados). Dar `/en/delete-account` funcionaria, mas forçaria todos os não-anglófonos a inglês numa página sobre destruição irreversível de dados.

**Host canónico:** resolvido — no Vercel o apex `eatease.eu` é encaminhado para `www.eatease.eu`. Submeter `https://www.eatease.eu/delete-account` (um salto); pelo apex seriam dois, o que funciona à mesma mas é desnecessário.

✅ **Bug corrigido — `Nav.tsx`.** O seletor de idioma fazia `router.push(`/${l}`)`, descartando o path atual: de `/en/delete-account`, escolher alemão levava a `/de` (homepage). Corrigido com `usePathname()` — `Nav.tsx:4` (import), `Nav.tsx:32` (hook), `Nav.tsx:73-80` (`switchLocale` preserva o path). Beneficia igualmente `/privacy-policy`, `/terms-of-use`, `/cookie-policy` e `/about-us`, que perdiam o contexto ao trocar de idioma.

## Key Assumptions to Validate

- [ ] **O template Magic Link não está em uso.** Confirmar no Dashboard → Auth → Email Templates que o template *Magic Link* não foi personalizado para outro fim antes de o mudar para `{{ .Token }}`.
- [ ] **Utilizadores OAuth-only são alcançáveis por OTP.** Contas criadas via Google/Apple (`SupabaseAuthService.ts:1157-1163`) têm email em `auth.users`, logo `signInWithOtp({shouldCreateUser:false})` chega-lhes. **Exceção: Apple Private Relay** (`*@privaterelay.appleid.com`) — o utilizador pode não conhecer esse endereço. Testar com uma conta Apple real; é o caso que justifica o fallback humano existir.
- [ ] **Não há enumeração de emails.** `shouldCreateUser: false` devolve erro para emails inexistentes → oráculo de enumeração. O route handler tem de devolver **sempre a mesma resposta** ("se existir conta, enviámos um código") independentemente do resultado.
- [ ] **Google aceita o fluxo com verificação.** O Play Console exige URL público sem login; um passo de verificação *depois* de a página carregar é aceite. Validar contra a Help page atual de *Data deletion*, cuja redação já mudou mais do que uma vez.
- [x] **Apagar `iap_receipt_log` e `subscriptions` não cria problema fiscal.** ✅ Confirmado: ambas cascateiam (`051:11`, `048:11`) e o registo fiscal de referência é o da Google/Apple. **Mas** a verificação revelou o `trial_ledger` (`092_create_trial_ledger.sql`): sha256 do email normalizado, sem FK por desenho, retido 12 meses, para impedir reutilização do período experimental. É retenção real que **tem** de ser divulgada nesta página — ver `docs/delete-account.md`, secção *Retenção do trial ledger*.

## MVP Scope

**Dentro:**
- Rota `/[lang]/delete-account` nas 10 locales, `page.tsx` + secção em `src/components/landing/`, seguindo o padrão de `PrivacyPolicySection.tsx`.
- Traduções no padrão **`form`/`pages`** (dicts por locale, traduzidos), **não** no padrão `legal.englishNotice` (inglês-only) — isto é UI funcional e a app já vende em 10 idiomas.
- Route handler `/api/account-deletion/request` — Turnstile + rate limit + OTP server-side, resposta constante.
- Passos 2 e 3 no browser: `verifyOtp` → `POST delete-account`.
- **Eliminação da linha em `contacts` da landing-page.** Mesmo responsável pelo tratamento (a privacy policy nomeia *Ricardo Jorge Pinto da Silva Rato*), dados pessoais (nome + email) num segundo projeto. Uma página intitulada "eliminar a minha conta e dados" que apaga a conta da app e deixa a linha da waitlist é incompleta face ao Art. 17 — e esta está na DB da própria landing-page, são poucas linhas.
- Fallback por formulário → Resend (reutiliza o padrão token + expiry + `rate_limits`).
- Link no `Footer.tsx` (coluna *Support*) + entrada no dict `footer`.
- Conteúdo de conformidade: dados apagados (perfil, membros da família, planos de refeições, listas de compras, favoritos, registos de refeições, alvos e caches de macros, dispositivos, notificações, subscrições, recibos IAP, ficheiros nos buckets `user-profiles`/`meal-images`/`recipe-images`/`documents`), dados que ficam (caches partilhadas `recipes`/`recipe_ingredients`/`recipe_translations` — sem FK a utilizadores, não são dados pessoais), prazo imediato, alternativa in-app, email de contacto.
- Config: adicionar `NEXT_PUBLIC_APP_SUPABASE_URL` + `NEXT_PUBLIC_APP_SUPABASE_ANON_KEY` ao `.env.local` e ao Vercel.
- Declarar o URL no Play Console **e** no formulário *Data safety*.

**Fora do MVP:**
- Exportação de dados (Art. 20 — portabilidade). Obrigação real, mas não é o que a Google está a pedir agora.
- Eliminação parcial ("apagar só os meus planos de refeições").
- Dashboard de gestão de pedidos.

## Task separada — repo `app` (aprovada, fora do scope da landing-page)

🔴 **`rate_limits` está exposta à role `anon`.** Em `database/migrations/001_add_security_indexes.sql:44-48`:

```sql
CREATE POLICY "Rate limits are viewable by system" ON public.rate_limits
  FOR SELECT USING (true);
CREATE POLICY "Rate limits are manageable by system" ON public.rate_limits
  FOR ALL USING (true);          -- sem cláusula TO → default TO public → inclui anon
```

Sem `TO`, o Postgres assume `TO public`, que inclui `anon`. Qualquer pessoa com a key do APK pode ler, inserir, alterar e **apagar** essa tabela — desligando o rate limiting ou trancando utilizadores. **Fix:** nova migration que faz `DROP POLICY` das duas e recria com `TO service_role`. Independente desta feature; deve ser feita de qualquer forma.

🟡 **Menor, mesma revisão:** `recipes`/`recipe_ingredients`/`recipe_translations` são escrita livre para qualquer utilizador *autenticado* (`038a`, `060`) — decisão de design consciente e documentada, mas permite envenenamento do cache partilhado por uma conta legítima. Não é anon. Registado, não urgente.

🟡 **Repo `landing-page`:** `src/app/api/contacts/route.ts:27` faz `console.log` do comprimento e dos 4 primeiros/últimos chars do `TURNSTILE_SECRET_KEY`. Remover ao reutilizar este ficheiro.

## Alternativas consideradas (e porque não)

| Alternativa | Porque não |
|---|---|
| **Deep link para a app** | Falha exatamente o caso que a Google quer cobrir: quem já desinstalou. |
| **Só página estática + `mailto:`** | Google aceita e custa zero código — é o *plano B se houver pressa de submissão*. Mas é trabalho manual por cada pedido, lento, e não escala. |
| **Só formulário de pedido com processamento manual** | Evita tocar no projeto da app, mas troca uma feature de ~1 dia por trabalho manual permanente, quando o hard-delete automático **já existe e já é chamável**. |
| **Proxy total por route handlers** | Não é mais seguro contra roubo de key (o APK já a entrega). Só se justifica no passo 1, pela razão do captcha — e é isso que fazemos. |
| **Captcha nativo do Supabase Auth** | É project-wide: partiria o `signInWithPassword` da app em produção. |
| **Privacy Center completo (export + delete)** | Versão 10x correta a prazo (Art. 20), mas fora do que desbloqueia a submissão hoje. |

## Open Questions

- Que endereço de contacto humano usar na página — `privacy@eatease.eu`, `support@eatease.eu`, ou o que já consta na privacy policy? Tem de ser consistente com o que lá está.
- A landing-page deve apagar a linha em `contacts` **sempre**, ou apresentar checkbox ("também me remover da lista de espera")? Recomendação: sempre, com aviso explícito no ecrã de confirmação — é o que a intenção do utilizador significa.
- O template *Magic Link* passa a ser usado para eliminação de conta. Vale a pena um template dedicado com copy própria ("Confirma a eliminação da tua conta EatEase"), em vez de reutilizar copy genérica de login?
- Prazo de submissão ao Play Console — se for esta semana, ponderar o plano B estático primeiro e o self-service logo a seguir.
