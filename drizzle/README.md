# Database Migration Workflow

This project has an existing PostgreSQL schema. Do not run `pnpm db:generate` as an
initial production migration because it would generate `CREATE TABLE` statements for
tables that already exist.

1. Back up production and restore it to a disposable database.
2. Set `MIGRATION_DATABASE_URL` to the disposable database's direct PostgreSQL URL.
3. Run `pnpm db:pull` and review the introspected schema and baseline metadata.
4. Compare the baseline with `server/db/schema.ts`, including table names, timestamp
   precision, indexes, and foreign-key actions.
5. Once the baseline is approved, initialize it on production with the same reviewed
   Drizzle workflow. Do not insert migration-log records manually.
6. Generate and review a separate migration that changes the foreign keys to
   `ON DELETE CASCADE`, then apply it in a serialized deployment migration job.

`DATABASE_URL` is the application connection URL. `MIGRATION_DATABASE_URL` should be
a DDL-capable direct PostgreSQL URL and must not be used by the application runtime.
