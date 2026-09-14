# Spec: Formulário de inscrição no teste fechado

> **Estado:** implementado. Todas as tasks fechadas — resta apagar o `closed_test_contacts.csv`, último passo da TASK-F.
> Substitui a waitlist. Relacionado: [`docs/delete-account.md`](./delete-account.md).

## Objective

A waitlist deixa de fazer sentido: a app vai entrar em teste fechado no Google Play, e não há tempo nem razão para manter duas listas. O formulário existente da landing-page passa a **inscrever testers**.

**Restrição de partida:** não há ninguém na waitlist neste momento — o que torna a transição limpa. Se houvesse contactos confirmados, transformá-los em testers seria uma **finalidade nova** (limitação das finalidades, RGPD) e exigiria pedir consentimento novo por email, não reaproveitar o antigo.

> **Suspeita a confirmar:** a ausência de inscritos é provavelmente consequência de um bug, não de falta de interesse — a `TURNSTILE_SECRET_KEY` errada no Vercel partia o formulário da waitlist em produção, e só foi detetada a 2026-09-10. Vale a pena olhar para as datas antes de concluir seja o que for sobre procura.

## Como funciona o teste fechado do Google Play

A correção que mudou o desenho: **a Google não envia o convite.** O Play Console dá um **link de opt-in** (`https://play.google.com/apps/testing/<package>`) que é distribuído por nós.

~~**Usar um Grupo Google como lista de testers**~~ — **decisão revertida a 2026-09-10, e a razão não é técnica:** criar o grupo implicava acrescentar serviços Google ao email associado à conta do Play Console, e o Ricardo não o quer fazer. A lista de testers é uma **lista de emails criada dentro do Play Console**.

| | **Lista de emails no Console** ✅ | Grupo Google (descartado) |
|---|---|---|
| Adicionar um tester | voltar ao Console, colar, guardar | adicionar membro ao grupo |
| Automatizável | **não — e nunca será** | sim (Directory API) |
| Registo no Play Console | a cada alteração | uma vez |
| Capacidade | 2 000 endereços/lista, 50 listas/track | sem limite publicado |

**As duas consequências que isto tem no plano:**

1. **A TASK-E morre.** O `edits.testers` da Play Developer API só aceita `googleGroups`; a documentação diz literalmente que *«does not support email lists»*. Não há forma de acrescentar ou remover testers por API, hoje nem depois — o que faz da instrução ao operador (TASK-16) a **única** via de remoção quando alguém elimina a conta.
2. **A divergência de chaves da §3.5 desaparece.** A preocupação era que a adesão a um grupo fica presa à *conta Google* do tester enquanto o pedido de eliminação traz o endereço escrito no formulário. A lista do Console contém exactamente os endereços que lá pomos, vindos do `contacts` — coincidem por construção.

**Sobre os 14 dias (resolvido a 2026-09-10):** a contagem só arranca quando houver **pelo menos 12 testers com opt-in**, e o que tem de se manter durante os 14 dias é esse mínimo. Acrescentar testers à lista não parte nada — só faria diferença se o total descesse abaixo de 12. Portanto o desenho «o formulário vai alimentando a lista» é compatível com o requisito, e a preocupação que fontes da comunidade levantavam sobre editar a lista dentro do Console não se aplica ao caso de **adicionar**.

> A implicação inversa continua de pé, e liga-se à TASK-16: **remover** um tester que eliminou a conta pode fazer o total descer abaixo de 12 e partir a contagem. Não é razão para não remover — é razão para o operador saber que, se estiver no limite, remover reinicia o período.

Requisitos do lado do tester: o email tem de ser uma **conta Google**, e a adesão ao grupo tem de estar **ativa** (não pendente) antes de o link de opt-in funcionar.

**A verificar no Play Console:** contas de programador pessoais criadas depois de certa data precisam de um número mínimo de testers com opt-in contínuo durante um período antes de poderem candidatar-se a produção. Os números já mudaram mais do que uma vez — confirmar na política atual, não em memória.

## Fluxo

```
1. User preenche o formulário na landing-page
2. Double opt-in — inalterado (contacts.token, 48h)
3. User confirma
   ├─ Email para o operador:  "adicionar <email> à lista do teste fechado no Play Console"
   └─ Email para o user:      "recebemos; o convite chega em breve (máx. 24h)"
4. Operador adiciona o email no Google Play Console   ← passo manual
5. Operador envia o link de opt-in ao user           ← passo manual, TASK-F
6. User abre o link, aceita, instala da Play Store
```

> **Nota de 2026-09-10:** o passo 4 é feito **no Play Console**, na lista de emails do teste
> fechado. Não há Grupo Google — ver a secção acima.

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

**O CSV saiu.** `closed_test_contacts.csv` guardava nome e email de pessoas que consentiram fora da plataforma: dados pessoais fora do alcance do `/delete-account`. A mesma razão que obriga `contacts` a ter caminho de eliminação obriga-as a estar lá dentro. `scripts/import-closed-test-contacts.mjs` fez a importação e fica no repo para ela ser reproduzível.

**Importação confirmada a 2026-09-12** contra a BD: **16 linhas com `source = 'manual'`** — não as 13 que esta secção dizia, porque a lista cresceu entre a escrita e a corrida. Ver *Estado do recrutamento* abaixo.

⚠️ **O `closed_test_contacts.csv` continua em disco** (está no `.gitignore`, portanto nunca foi commitado). O argumento desta secção era que os dados tinham de passar para `contacts` *para poderem ser apagados*; agora que passaram, o ficheiro é uma segunda cópia dos mesmos dados pessoais, fora de qualquer caminho de eliminação. **Apagá-lo é o último passo da TASK-F** e está por fazer.

Isto importa para a página de eliminação: `contacts` continua a guardar nome e email sob a responsabilidade do mesmo responsável pelo tratamento, logo continua a precisar do seu caminho de eliminação — seja waitlist ou lista de testers.

## Tasks

### TASK-A: Copy do formulário e da secção CTA
- **Ficheiros:** `src/lib/i18n/locales/{10}/form.ts`, `cta.ts`
- **O quê:** de «entra na lista de espera» para «inscreve-te no teste fechado». Deixar claro que (a) é preciso uma **conta Google**, (b) o acesso chega por email, (c) é uma versão de teste.
- **Constraint:** as 10 locales na mesma task — `Translations = typeof en` faz o `tsc` falhar até todas terem as chaves.
- **Alargada** para `nav`, `hero` e `pages` (§3.3 da revisão) e para os dois documentos legais (§3.4). A chave `joinWaitlist` passou a `joinClosedTest` — nome e valor deixam de discordar.
- **A App Store fica como estava:** não há TestFlight, e há um teste que exige que o par `appStore*` continue a dizer «brevemente». Uma varredura que renomeasse todas as strings de loja ao mesmo tempo anunciaria um build iOS que não existe.
- **Status:** [x] COMPLETE — guardado por `src/lib/i18n/closedTestCopy.test.ts` (60)

### TASK-B: Email ao operador na confirmação
- **Ficheiros:** `src/app/api/contacts/confirm/route.ts`
- **O quê:** ao confirmar, enviar ao operador um email com o endereço a adicionar ao grupo. Hoje o `confirm` só envia o email de boas-vindas ao utilizador.
- **Porquê na confirmação e não na submissão:** garante que **todos os emails recebidos são acionáveis** — sem ruído de inscrições abandonadas ou maliciosas.
- **⚠️ Correção à descrição acima:** o `confirm` **já envia** um email ao operador (`route.ts:63-82` → `src/templates/new-user-confirmation.html` → `RESEND_WELCOME_EMAIL`). A task é **reescrever** esse email, não acrescentar outro — implementada como está descrita, o operador passa a receber dois por inscrição.
- **Herda o tratamento da TASK-17/TASK-18, e aqui era mais grave:** o `Promise.all` não inspeccionava `{ error }`, a rota gravava `confirmed = true` **antes** dos envios, e o segundo clique caía no early-return do `contact.confirmed` e não reenviava — a inscrição do tester perdia-se em definitivo.
- **Resolvido pela ordem, não só pela verificação:** notificar o operador primeiro, marcar a linha só depois de a Resend aceitar. O token continua válido 48h, portanto uma tentativa falhada resolve-se clicando outra vez no mesmo link — não foi preciso inventar via de reenvio. O email de boas-vindas fica best-effort.
- **Mais:** `getResend()` (o `new Resend()` em module scope matava a rota no import), `SIGNUP_NOTIFICATION_TO_EMAIL` separado do remetente do email ao visitante, e a página de erro passa a mostrar o código — um link de confirmação falhado não tem formulário para resubmeter nem corpo de resposta para ninguém ler.
- **Status:** [x] COMPLETE — guardado por `src/app/api/contacts/confirm/route.test.ts` (11)

### TASK-C: Copy do email de boas-vindas
- **Ficheiros:** `src/lib/i18n/locales/{10}/emails.ts`, `src/templates/welcome-email.html`
- **O quê:** de «avisamos-te no lançamento» para «o convite chega em 48 horas». **Não** afirma que o acesso já está concedido — nesse instante ainda não está.
- **48 e não 24:** prazo escolhido pelo operador (2026-09-10). Os passos 4 e 5 são manuais; 24h só se escreveria com o compromisso de olhar para a caixa todos os dias.
- **Status:** [x] COMPLETE — a mesma frase entrou também em `pages.confirmed.body`, que é onde o utilizador aterra e que nenhuma task cobria.

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
- **Status:** [x] COMPLETE — código **e** execução. Correu a sério a 2026-09-12: 16 contactos importados do CSV e **17 convites enviados e marcados**, 0 por convidar. Verificado contra a BD, não por relato.
  **Falta o último passo:** apagar o `closed_test_contacts.csv`, que continua em disco. Ver a nota no *Schema*.

### TASK-D: Play Console — lista de testers
- **O quê:** lista de emails criada dentro do Play Console (não um Grupo Google — ver acima), testers registados, os dois links guardados.
- **Status:** [x] COMPLETE (2026-09-10) — convites enviados, testers a aderir.

### ~~TASK-E (futuro): automatizar a adição ao grupo~~
- **Status:** [—] IMPOSSÍVEL. O `edits.testers` da Play Developer API só aceita `googleGroups` e a documentação diz que *«does not support email lists»*. Sem grupo não há API, e sem API a adição e a remoção de testers são manuais para sempre.
- **Consequência a jusante:** a remoção do tester quando ele elimina a conta (TASK-16) só pode ser uma instrução ao operador. A Fase 2 não pode prometer automatização.

### TASK-16: a eliminação alcança a lista de testers
- **O quê:** o email ao operador de `api/account-deletion/route.ts` instrui a remover o endereço da lista do Play Console, e o `deleteAccount` deixa de prometer mais do que apaga.
- **Descoberto durante:** verificar o caminho *in-app*. A edge function da app (`app/supabase/functions/delete-account/index.ts`) apaga storage e o utilizador de auth **no projeto Supabase da app**, que não vê o `contacts` da landing-page nem o Play Console. Quem elimina por lá continuava tester, com acesso ao build, e o `inApp.body` apresentava esse caminho como o mais rápido sem dizer que era o incompleto.
- **Status:** [x] COMPLETE — guardado por 20 asserções em `deleteAccountCopy.test.ts` + 1 em `account-deletion/route.test.ts`.

## Estado do recrutamento — verificado a 2026-09-12

A sequência abaixo **já correu por inteiro**: importação feita, convites
enviados, testers a aderir.

| Em `contacts` (BD da landing-page) | |
|---|---|
| Total | **17** |
| Confirmados | **17** (0 por confirmar) |
| Convidados (`closed_test_invited_at`) | **17** (0 por convidar) |
| Origem | **16** `manual` (CSV) · **1** `form` |
| Locale | 17 × `pt-pt` |

**Duas contagens diferentes, e é importante não as confundir.** «17 convidados»
é quem recebeu o email; **«7 testers» é quem aderiu de facto** no Play Console,
e é esse o número que conta para o requisito. São coisas distintas porque a
adesão é um passo que a pessoa tem de dar — e é precisamente por isso que o
convite leva o link de **adesão na web** primeiro.

**O que isto quer dizer:** faltam **5 adesões** para as 12 que o Google exige
(14 dias consecutivos). Dos 17 convidados, **10 ainda não aderiram** — e só
**1 pessoa** chegou pelo formulário do site. O gargalo não é a captação de
emails, é a conversão de convite em adesão.

## Arrancar o teste fechado — a sequência

```bash
node scripts/import-closed-test-contacts.mjs --dry-run   # confere as linhas do CSV
node scripts/import-closed-test-contacts.mjs             # CSV -> contacts (uma vez)
# ... registar os emails no Play Console, guardar o link de opt-in ...
# no .env.local, os DOIS links de "Como os testadores participam no seu teste":
#   CLOSED_TEST_OPT_IN_URL=https://play.google.com/apps/testing/<package>         (Adesao na web)
#   CLOSED_TEST_DOWNLOAD_URL=https://play.google.com/store/apps/details?id=<pkg>  (Adesao Android)
#   CLOSED_TEST_FROM_EMAIL=ricardo.rato@eatease.eu   (caixa real: o email pede resposta)
node scripts/send-closed-test-invite.mjs --dry-run       # quem receberia
node scripts/send-closed-test-invite.mjs                 # envia e marca
```

**A ordem importa, duas vezes.** Sem a importação, o envio encontra menos
contactos do que julgas. E dentro do email o link de **adesão na web** vem
primeiro: a ficha da loja só resolve depois da adesão, e instalar por ela **não
conta** para o requisito dos 12 testadores.

Reentrante: quem falhar fica com `closed_test_invited_at` a `NULL` e entra na
execução seguinte. Quem se inscrever pelo formulário a partir daqui aparece
sozinho na próxima passagem — não é preciso tocar em ficheiro nenhum.

## Nota de i18n — a *Constraint dura* durante edições em paralelo

`emails.closedTestInvite` (TASK-F) está **completo nas 10 locales** desde 2026-09-10,
e o mesmo para o `emails.privacyPolicy`.

Fica o padrão registado, porque volta a acontecer: `Translations = typeof en`, portanto acrescentar
uma chave a `en` faz o `tsc` falhar nas outras nove até todas a terem. Com o Ricardo a editar o repo
em paralelo com as sessões, essa janela aparece **a meio de um rollout** — não é um erro de ninguém,
é o tipo a funcionar. Duas armadilhas:

- **O `npm test` fica verde na mesma.** O Vitest não faz type-check e em runtime só `en` é carregado.
  Uma suite verde não prova que o `build` passa — correr `npx tsc --noEmit` sempre à parte.
- **O estado muda debaixo dos pés.** Verificar imediatamente antes de dar uma task por concluída,
  não no início da sessão. Numa sessão o `tsc` deu 0 erros numa passagem e falhou na seguinte,
  porque um ficheiro foi gravado entretanto.

Diagnóstico, para qualquer chave nova:

```bash
npx tsc --noEmit 2>&1 | grep -oE "Property '[a-zA-Z]+' is missing" | sort -u
for l in de en es fr it nl pl pt-pt ro sv; do
  printf "%-6s " "$l"; grep -q "<chave>" src/lib/i18n/locales/$l/emails.ts && echo ok || echo FALTA
done
```

## Em aberto — não bloqueia nada

**Variáveis de ambiente.** O `RESEND_WELCOME_EMAIL` faltava na Vercel e foi
acrescentado a 2026-09-10, com redeploy — é uma caixa real, que o Ricardo lê, e
é dela que sai o email a avisar que o endereço foi acrescentado ao Play Console.
O `SIGNUP_NOTIFICATION_TO_EMAIL` **continua por definir** e o fallback aponta
para ela, o que é seguro; defini-lo só serve para as duas coisas — remetente do
email ao visitante e destinatário da notificação ao operador — deixarem de estar
presas à mesma variável.

**A tradução em falta, que é a maior coisa desta lista.** O `pt-pt` não tem
tradução dos três documentos legais: o `locales/pt-pt/index.ts` **re-exporta os
objectos do `en`** (`privacyPolicy`, `termsOfUse`, `cookiePolicy`). Quem visita
o site em português lê-os em inglês, e **as outras oito locales estão na mesma
situação** — nove sites a servir documentos legais em inglês. O
`closedTestCopy.test.ts` detecta-o por identidade de objecto e salta-os; no dia
em que forem traduzidos passam a ser verificados sozinhos, sem alterar o teste.

## Boundaries

- **Nunca** afirmar num email que o acesso está concedido antes de o estar.
- **Nunca** reaproveitar consentimento de waitlist para inscrição em teste sem pedir de novo (não se aplica hoje — lista vazia).
- **Sempre** as 10 locales na mesma task.

## Open Questions

1. **Nome e endereço do Grupo Google** — `testers@eatease.eu`?
2. **Emails que não são contas Google** — detetar e avisar no formulário, ou deixar falhar no opt-in? Avisar é mais gentil, mas não há forma fiável de o validar a partir do endereço.
3. **Limite de testers** — o teste fechado tem um teto; vale a pena fechar as inscrições ao atingi-lo, ou gerir manualmente?
