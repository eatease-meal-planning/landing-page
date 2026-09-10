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
4. Operador adiciona ao Grupo Google
5. Operador envia o link de opt-in ao user           ← passo manual, por agora
6. User abre o link, aceita, instala da Play Store
```

**Porque o email do passo 3 não pode dizer «foste adicionado».** Nesse instante ainda não foi — o passo 4 é manual e vem depois. Um email que anuncia acesso que ainda não existe mente durante essa janela. Daí a formulação «recebemos, o convite chega em breve».

**Quando o passo 4 for automatizado** (Directory API), os passos 3–5 colapsam: o email de confirmação passa a levar o link de opt-in diretamente e o trabalho manual desaparece.

## Schema

**Nenhuma alteração.** A tabela `contacts` mantém-se tal como está (`name`, `email`, `locale`, `confirmed`, `confirmedAt`, `token`, `tokenExpiresAt`). Muda o significado das linhas e a copy, não a forma.

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
- **Status:** [ ] TODO

### TASK-C: Copy do email de boas-vindas
- **Ficheiros:** `src/lib/i18n/locales/{10}/emails.ts`, `src/templates/welcome-email.html`
- **O quê:** de «avisamos-te no lançamento» para «recebemos a tua inscrição; o convite para o teste chega em 24h». **Não** afirmar que o acesso já está concedido.
- **Status:** [ ] TODO

### TASK-D: Play Console — Grupo Google
- **O quê:** criar o grupo (ex.: `testers@eatease.eu`), registá-lo como lista de teste fechado, guardar o link de opt-in.
- **Status:** [ ] TODO — **requer acesso ao Play Console (utilizador)**

### TASK-E (futuro): automatizar a adição ao grupo
- **O quê:** Directory API a partir do handler de confirmação; o email passa a levar o link de opt-in e o passo manual desaparece.
- **Depende de:** `eatease.eu` em Google Workspace + service account com delegação.
- **Status:** [ ] TODO — otimização, não bloqueia nada

## Boundaries

- **Nunca** afirmar num email que o acesso está concedido antes de o estar.
- **Nunca** reaproveitar consentimento de waitlist para inscrição em teste sem pedir de novo (não se aplica hoje — lista vazia).
- **Sempre** as 10 locales na mesma task.

## Open Questions

1. **Nome e endereço do Grupo Google** — `testers@eatease.eu`?
2. **Emails que não são contas Google** — detetar e avisar no formulário, ou deixar falhar no opt-in? Avisar é mais gentil, mas não há forma fiável de o validar a partir do endereço.
3. **Limite de testers** — o teste fechado tem um teto; vale a pena fechar as inscrições ao atingi-lo, ou gerir manualmente?
