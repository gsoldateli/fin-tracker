<!-- BEGIN:nextjs-agent-rules -->
# Project Context for AI Agents

## Stack
- Next.js 16
- Drizzle ORM with Neon serverless PostgreSQL
- shadcn/ui components (Radix UI primitives)
- Tailwind CSS
- Zod for validation

## File Structure
- `src/db/schema.ts` – Drizzle tables (accounts, transactions, transfers)
- `src/db/index.ts` – database client singleton
- `src/services/` – server actions (e.g., `accounts.ts`, `transactions.ts`)
- `src/components/custom/` – app-specific components (TransactionRow, AccountCard)
- `src/app/(dashboard)/` – routes with bottom tab navigation

## Conventions
- Prefer Server Components unless interactivity needed.
- Data mutations use Server Actions (no API Routes unless necessary).
- Use `useOptimistic` for instant UI feedback on mutations.
- All form inputs validated with Zod.
- Queries: use Drizzle relational queries (`db.query.accounts.findMany()`) with proper joins.
- Type imports: from Drizzle inferred types (`typeof accounts.$inferSelect`).
- UI states: loading (Skeleton), empty (custom message), error (Alert).
- Naming: camelCase for variables, PascalCase components.
- Imports: use `@/` alias for src.

## Database Schema (already defined)
- accounts: id (uuid), name, type (enum: bank/cash/savings), balance (float), created_at, updated_at
- transactions: id, type (enum: INCOME/EXPENSE), amount, category, description, due_date (date), payment_date (date nullable), account_id (FK accounts), created_at, updated_at
- transfers: id, from_account_id (FK), to_account_id (FK), amount, date, description, created_at
<!-- END:nextjs-agent-rules -->
