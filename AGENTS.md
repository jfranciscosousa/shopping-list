# Development

Set `ALLOWED_DEV_ORIGINS` to a comma-separated list of hostnames that may access Next.js development resources.

# Database Instructions

## Local PostgreSQL

- Use the PostgreSQL version pinned in `.tool-versions` through mise. Do not rely on a system PostgreSQL installation.
- Keep local database state outside the repository. Use `/tmp` or another workspace-specific temporary directory.
- Use a unique local port and database name for each workspace to avoid affecting another checkout.
- Never run `db:pull --init`, `db:migrate`, or destructive SQL against production without explicit user approval and a verified direct migration URL.

## Drizzle Workflow

- `server/db/schema.ts` is the application schema source of truth after the existing database has been baselined.
- Preserve the existing quoted table and column names unless a reviewed migration intentionally renames them.
- Use `DATABASE_URL` for application queries and `MIGRATION_DATABASE_URL` only for schema operations.
- For an existing database, first introspect a disposable clone with `pnpm db:pull`, review the output, then establish the production baseline using Drizzle's supported workflow. Do not manually write migration-log rows.
- Generate migrations with `pnpm db:generate`, review the SQL and migration metadata, then apply them through a serialized deployment migration job.
- Keep foreign-key cascades intentional and covered by tests. User deletion cascades to all user-owned rows, category deletion cascades to shopping items, and pantry-area deletion cascades to pantry items.

## Query Safety

- Scope every read and mutation by the authenticated user ID.
- Verify that a target pantry area belongs to the authenticated user before creating or moving a pantry item.
- Set `updatedAt` in every application-level update unless a reviewed database trigger replaces that behavior.
