# Próximo passo

> O que fazer a seguir e em que ordem. **Não é um log:** o que já foi feito está
> no spec respetivo, com a prova ao lado. Atualizado a **2026-09-12**.

| | |
|---|---|
| Specs | [`closed-test-signup.md`](./closed-test-signup.md) · [`delete-account.md`](./delete-account.md) |
| Revisões | [`spec-review.md`](./spec-review.md) · [`audit-migration-001.md`](./audit-migration-001.md) |

## Estado

- **Esta árvore está verde:** `npm test` 180/180, `npx tsc --noEmit` 0 erros.
- **Nenhuma chave de i18n a meio de rollout.** Se aparecerem erros de `Property … is missing`, é a *Constraint dura* — diagnóstico na *Nota de i18n* do [`closed-test-signup.md`](./closed-test-signup.md), e **não é erro de ninguém**.
- **A Fase 1 do `/delete-account` está em produção** e o teste fechado está a recrutar.
- **A autorização nominal no repo `app` está esgotada.** As migrations `122`-`125` e a copy das 10 locales estão feitas; o que venha a seguir nesse repo volta ao «perguntar primeiro» (*Boundaries* do [`delete-account.md`](./delete-account.md)).

## Ordem a seguir

```
1. Fase 2 do /delete-account   <- A SEGUIR, e é tudo nesta árvore menos a 09
   TASK-09  template Magic Link      (Dashboard - precisa do utilizador)
   TASK-03  clientes Supabase da app
   TASK-04  POST /api/account-deletion/request
   TASK-05  POST /api/account-deletion/waitlist
   TASK-13  máquina de 3 passos      (bloqueada pela §4.1: partir o componente primeiro)
   TASK-14  copy e retenções         (MESMO commit que a 13 - a copy só fica verdadeira aí)

2. Sem data, e nenhuma bloqueia a Fase 2:
   TASK-24/25/26  achados da auditoria da 001, no repo `app`  <- perguntar primeiro
   Tradução dos 3 documentos legais   <- nove locales servem-nos em inglês
```

**A TASK-09 é a primeira porque é a única que não depende de mim.** Precisa de
acesso ao Dashboard; pedi-la cedo evita que a TASK-04 fique à espera dela.

**A TASK-E é impossível, não está pendente.** O `edits.testers` da Play
Developer API só aceita `googleGroups`; sem grupo não há API, e a gestão de
testers é manual para sempre.

## A confirmar ao começar

Uma pergunta que não consigo responder daqui: **a importação do CSV para
`contacts` já correu a sério?** O `closed-test-signup.md` dá a TASK-D como feita
e os convites como enviados, mas registou a TASK-F como «código completo, a
correr depende do link» e a importação como «por correr». Se ainda não correu, é
o primeiro comando da secção *Arrancar o teste fechado* — e o
`closed_test_contacts.csv` só se apaga **depois** de ela passar.

## Portão de verificação

```bash
npm test            # 180 testes
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
