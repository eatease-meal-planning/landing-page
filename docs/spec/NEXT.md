# Próximo passo

> O que fazer a seguir e em que ordem. **Não é um log:** o que já foi feito está
> no spec respetivo, com a prova ao lado. Atualizado a **2026-09-12**.

| | |
|---|---|
| Specs | [`closed-test-signup.md`](./closed-test-signup.md) · [`delete-account.md`](./delete-account.md) |
| Revisões | [`spec-review.md`](./spec-review.md) · [`audit-migration-001.md`](./audit-migration-001.md) |

## Estado

- **Esta árvore está verde:** `npm test` 345/345, `npx tsc --noEmit` 0 erros.
- **Nenhuma chave de i18n a meio de rollout.** Se aparecerem erros de `Property … is missing`, é a *Constraint dura* — diagnóstico na *Nota de i18n* do [`closed-test-signup.md`](./closed-test-signup.md), e **não é erro de ninguém**.
- **O `/delete-account` está inteiro em produção, Fase 1 e Fase 2**, verificado ponta-a-ponta a 2026-09-14. Falta submeter o URL no Play Console (TASK-10).
- **O teste fechado está a recrutar, e é aqui que está o gargalo:** 17 convidados, **7 aderiram**, faltam **5** para as 12 que o Google exige. Detalhe em [`closed-test-signup.md`](./closed-test-signup.md), *Estado do recrutamento*.
- **O SMTP de Auth do projeto da app passou a Resend a 2026-09-12**, e com ele o `resetPasswordForEmail` da app, que estava a falhar para todos os testers — o serviço interno do Supabase não entrega a quem não pertence à equipa do projeto. Por confirmar com um teste manual: uma reposição de password a partir da app.
- **A autorização nominal no repo `app` está esgotada.** As migrations `122`-`125` e a copy das 10 locales estão feitas; o que venha a seguir nesse repo volta ao «perguntar primeiro» (*Boundaries* do [`delete-account.md`](./delete-account.md)).

## Ordem a seguir

```
1. Fase 2 do /delete-account   <- FECHADA, verificada em producao a 2026-09-14
   TASK-09  template Magic Link                  [x] FEITA a 2026-09-14
   TASK-03  clientes Supabase da app          [x] FEITA a 2026-09-12
   TASK-04  POST /api/account-deletion/request   [x] FEITA a 2026-09-12
            (a §4.2 ficou feita aqui: src/lib/apiGuards.ts)
   TASK-05  POST /api/account-deletion/registration   [x] FEITA a 2026-09-12
   TASK-13  máquina de 3 passos                  [x] FEITA a 2026-09-13
   TASK-14  copy e retenções                     [x] FEITA a 2026-09-13
            (mesmo commit da 13, como mandava)
   /verify + /confirm  o browser deixou de falar com o projeto da app,
            e as envs perderam o NEXT_PUBLIC_   [x] FEITO a 2026-09-13

   Fica um unico criterio por confirmar, e sao dois minutos: o formulario
   manual nao foi reverificado depois de a TASK-13 o mover para dentro do
   <details>. O codigo nao mudou, mas isso e inferencia.

2. A SEGUIR, e nenhuma depende das outras:
   Submeter https://www.eatease.eu/delete-account no Play Console
      <- o que faltava da TASK-10: campo de eliminacao E formulario Data safety.
         E o unico passo que a Google ainda nao viu.
   Migrar /api/contacts e /api/account-deletion para o runRequestGuards
      <- commit proprio, com os 225+7 testes deles como portao
   Apagar o closed_test_contacts.csv  <- último passo da TASK-F, está por fazer
   TASK-24/25/26  achados da auditoria da 001, no repo `app`  <- perguntar primeiro
   Tradução dos 3 documentos legais   <- nove locales servem-nos em inglês
```

**O que não está na lista porque não é código:** faltam 5 adesões ao teste
fechado. Dos 17 convidados, 10 ainda não aderiram, e só 1 pessoa chegou pelo
formulário do site. Nenhuma task desta lista mexe nesse número.

**A TASK-09 é a primeira porque é a única que não depende de mim.** Precisa de
acesso ao Dashboard; pedi-la cedo evita que a TASK-04 fique à espera dela.

**A TASK-E é impossível, não está pendente.** O `edits.testers` da Play
Developer API só aceita `googleGroups`; sem grupo não há API, e a gestão de
testers é manual para sempre.

## Acesso à base de dados — o que o MCP alcança e o que não

**O Supabase MCP desta sessão está ligado ao projeto da *app***
(`dagpiagorabmliuotkoc`), não ao da landing-page. Verificado: as tabelas que
devolve são `user_profiles`, `recipes`, `trial_ledger`… e **não há `contacts`
nenhum lá**. Para a BD desta árvore o MCP não serve.

O caminho que serve, e não passa por ler o `.env`: um script `.mjs` que importe
o `loadEnv()` de `scripts/_shared.mjs`, que carrega o `.env.local` para o
`process.env` sozinho. O `send-closed-test-invite.mjs --dry-run` também é
estritamente leitura — o `if (deps.dryRun) { … continue; }` de
`src/lib/closedTestInvite.ts:182` sai antes do envio e antes do `markInvited`.

## Portão de verificação

```bash
npm test            # 345 testes
npx tsc --noEmit    # 0 erros exigidos - correr SEMPRE à parte; a suite não faz type-check
npm run lint        # 0 erros (2 warnings pré-existentes)
npm run build
```

> O servidor de dev é corrido pelo utilizador num terminal próprio — **não
> arrancar `npm run dev`**.

**Convenção de commits:** cada task implementada e testada leva um commit
próprio, com `feat:` / `arch:` / `fix:` / `docs:` e uma descrição breve.

## Onde está o quê

| Procuras | Está em |
|---|---|
| O que uma task fez, e a prova | o `### TASK-nn` do spec respetivo |
| Sequência para arrancar o teste fechado | `closed-test-signup.md` |
| A armadilha do `tsc` nas 10 locales | `closed-test-signup.md` |
| Variáveis de ambiente em aberto | `closed-test-signup.md` |
| Registo do `pt-pt`, estrutura dos dicts | `delete-account.md`, *i18n Scope* |
| O que o repo `app` autoriza, e a condição | `delete-account.md`, *Boundaries* |
| Defeitos de BD e onde escrever o teste deles | `audit-migration-001.md` |
| Commits | `git log` |
