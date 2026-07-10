# Agent instructions — fin-tracker

Read this file fully before making any change. If a request conflicts with
something here, say so and ask before proceeding — do not silently override
a documented decision.

## Stack

Next.js (App Router) · TypeScript · Drizzle ORM · Turso (libSQL) · Zod ·
shadcn/ui · Vitest · GitHub Actions · Vercel

Node version is pinned in `.nvmrc`. Use it — do not assume a different
runtime.

## Architecture

Organized by **feature (vertical slices)**, not by technical layer:

```
src/features/<feature>/
├── components/     # UI
├── actions.ts      # Server Actions — thin: session → validate → call service
├── service.ts      # business rules, framework-free, receives `db` as a param
├── queries.ts      # reads
└── schemas.ts      # Zod validation + inferred types
```

Do not introduce Clean Architecture layers (`ports/`, `adapters/`,
`use-cases/`). For this project's size that adds indirection without
adding clarity.

## Non-negotiable rules

These were each chosen deliberately, with a rejected alternative. Do not
"improve" them without discussion.


### User Experience rules
- All user facing text must be in english.

### Money is always an integer, in cents

`amountCents: integer`, never a float. Floats cannot represent currency
exactly and errors compound silently in a ledger.

The sign carries meaning: expenses are negative, income is positive, and
both legs of a transfer are `-X` / `+X`. This is what makes account
balance a plain `SUM(amountCents)` — never branch on `type` to decide the
sign inside a query.

### Account balance is derived, never stored

There is no `balance` column on `accounts`. Balance is always
`SUM(transactions.amountCents) WHERE accountId = X`, computed at read
time.

Rejected alternative: a stored `currentBalance` column updated on every
write. That creates a second source of truth that can silently diverge
from the transaction log — the classic ledger bug. At this project's
scale (hundreds of transactions per user, indexed), the `SUM` is
effectively free. Do not add a stored balance column. If this ever needs
revisiting, the correct next step is a snapshot/checkpoint pattern
(periodic consolidated balance + sum of transactions after the
checkpoint), not a mutable balance field.

### Initial account balance is a transaction, not a column

When an account is created with a non-zero starting balance, insert a
`transactions` row with `type: "initial_balance"` for that amount — do
not add an `initialBalanceCents` field to `accounts`. This keeps the
balance query a single, unconditional `SUM` with zero special cases.

The account creation and the initial-balance transaction insert happen in
the same `db.transaction()`. If the balance is exactly `0`, do not insert
a row — a zero-amount transaction is noise.

`initial_balance` is excluded from the cash flow report, same reasoning
as transfers below.

### A transfer is two atomic rows

Modeled as **two `transactions` rows** — one debit (`-X`), one credit
(`+X`) — written inside a single `db.transaction()`, linked by a shared
`transferGroupId` (nullable `text`, no FK — just a shared UUID).

If the credit leg fails, the debit must roll back. Do not implement a
transfer as a single row with `fromId`/`toId` columns — that complicates
every balance query, which would need to check two different columns
instead of one.

`counterpartyAccountId` (the other account in a transfer) does **not**
cascade on delete. Deleting the counterpart account must not silently
erase the other leg's history — this is a deliberate `onDelete: restrict`.

### Transfers are neither income nor expense

The cash flow report must exclude `type = 'transfer'` (and
`type = 'initial_balance'`) from its aggregations. Moving money between
your own accounts does not change net worth; counting both legs inflates
both income and expense for that period. There must be a test asserting
this explicitly.

### No Repository Pattern

Services call Drizzle directly. Drizzle is already a thin, typed
abstraction over SQL — wrapping it in a repository interface adds a
forwarding layer with no gain, and trades away Drizzle's type inference
for a hand-written interface. Do not introduce one.

### Dependency injection without a framework

Every `service.ts` function takes `db: Database` as its first parameter:

```typescript
export async function transfer(db: Database, input: TransferInput) { ... }
```

Never import a `db` singleton inside a service file. This is what makes
services testable against a real in-memory database without a mocking
library or DI container. `queries.ts` (pure reads, no business rule) may
import `db` directly — the DI requirement applies to `service.ts`.

### `Result<T, E>` for domain errors, exceptions for infrastructure failures

Expected business outcomes (insufficient funds, account not found,
category type mismatch) return a typed `Result`:

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

Do not `throw` for these. Reserve exceptions for genuinely exceptional
conditions (DB connection lost, missing required env var).

### Every query filters by the session's `userId`

Middleware (`src/middleware.ts`) only confirms a valid session exists —
it does not check data ownership. Every `service.ts` and `queries.ts`
function that touches user data must filter or check `userId` explicitly.
Middleware is authentication; the `WHERE userId = ...` clause is
authorization. Do not rely on the middleware alone — that's the classic
IDOR mistake.

When an authorization check fails (e.g. deleting someone else's account),
return `ACCOUNT_NOT_FOUND`, not `FORBIDDEN` — don't leak whether the
resource exists for another user.

### Secrets are read inside functions, not at module scope

```typescript
// ❌ never do this — runs during `next build` page-data collection
const secret = process.env.SESSION_SECRET!;

// ✅ do this — only runs when a session is actually created/verified
function getSecret(): Uint8Array {
  const raw = process.env.SESSION_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error("SESSION_SECRET is missing or too short (minimum 32 characters)");
  }
  return new TextEncoder().encode(raw);
}
```

A module-scope guard breaks the Next.js build because pages are analyzed
before any request exists. This applies to `session.ts` and
`middleware.ts`. `drizzle.config.ts` is the one legitimate exception —
it only runs via CLI invocation, never during the Next.js build.

## Domain-specific decisions

### Auth: email-only, upsert-based

`findOrCreateUser` is a single atomic `onConflictDoUpdate` upsert keyed on
email — not a `select` then conditional `insert`, which has a race
condition on concurrent submissions. There must be a test firing two
concurrent logins with the same email and asserting exactly one user is
created, with the same `id` returned both times.

Known, documented limitation: there is no email verification (no magic
link/OTP). Anyone can log in as any email address. Do not silently "fix"
this by adding verification without discussion — it's an accepted scope
boundary, not an oversight.

### Categories are user-owned, seeded at signup

`categories` table: `userId`, `name`, `type` (`"income" | "expense"`),
`unique(userId, name, type)`. Not global constants, not per-account.

Default categories are seeded inside `findOrCreateUser`, in the **same
db.transaction()** as user creation, guarded by a check that categories
don't already exist for that user — otherwise every subsequent login
would duplicate them. There must be a test for "logging in twice does not
duplicate categories."

`transactions.categoryId` is nullable (transfers and initial-balance
transactions have no category) and has **no cascade** — SQLite cannot
express "categoryId must reference a category of the same type" as a
schema constraint, so the service must check this explicitly before
insert:

```typescript
if (category.type !== input.type) {
  return { ok: false, error: "CATEGORY_TYPE_MISMATCH" };
}
```

This check also enforces that the category belongs to the requesting
user — do the ownership + type check together, in the service, before
writing the transaction.

## Testing strategy

### Integration tests run against a real database

```typescript
const client = createClient({ url: ":memory:" });
const db = drizzle(client, { schema });
await migrate(db, { migrationsFolder: "./drizzle" }); // matches drizzle.config.ts `out`
```

Never mock the Drizzle client. This tests the schema and real SQL for
free — a broken migration fails the suite immediately.

### Name tests after business rules, not implementation

```
✓ debits the source and credits the destination by the same amount
✓ rejects a transfer with insufficient funds without changing any balance
✓ does not allow transferring to another user's account
✓ transfers are excluded from the cash flow report
✓ logging in twice does not duplicate categories
```

A test asserting only the returned error is incomplete — also assert the
absence of side effects (balances unchanged, no duplicate row created).

### Every new feature needs

1. Unit test for the Zod schema (pure logic — normalization, validation
   edge cases).
2. Integration test for `service.ts` against the in-memory DB, using
   factories from `tests/helpers/factories.ts`.

### What is deliberately not unit-tested

- Server Actions: thin glue (validate → call service → redirect/revalidate).
  Covered by E2E only.
- Simple presentational components: covered by E2E.
- There is no coverage percentage target. Do not optimize for coverage
  numbers on trivial code.

## Feature checklist

When adding a new feature, follow this order:

1. Schema in `src/db/schema.ts` (with the right indexes for the queries
   you know you'll run) → `npm run drizzle:generate`
2. `schemas.ts` (Zod, including any discriminated unions needed for
   type-scoped validation)
3. `service.ts` (business rules, `db` injected as first param, `Result`
   for domain errors)
4. `queries.ts` (reads, always filtered by `userId`)
5. `actions.ts` (Server Action: get session → validate with Zod → call
   service → `revalidatePath`)
6. `components/` (Server Components by default; `"use client"` only
   where interactivity — e.g. `useActionState` — requires it)
7. `service.test.ts` — integration tests against `:memory:` libSQL,
   named after business rules

## CI/CD

Three workflows: `ci.yml` (lint, typecheck, test — runs automatically on
push/PR, also `workflow_call`-able), `preview.yml` (manual trigger, any
branch), `production.yml` (manual trigger, locked to the `release` branch
by an explicit guard job). Migrations run before deploy, never after.

Do not add automatic production deploys on push. This is intentional —
production deploys are a manual, reviewed action.

## When in doubt

Prefer the option that keeps the codebase small and each file's
responsibility obvious over the option that adds a "just in case"
abstraction. If you're about to add a pattern (repository, factory,
generic base class) to solve a problem that doesn't exist yet in this
codebase, stop and ask first.