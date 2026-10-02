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

## UUID cutover

`20261002202727_uuid_ids` converts all five tables and their foreign keys to UUIDs.
It preserves every row, relationship, timestamp, and installed foreign-key action.
New rows use PostgreSQL's `gen_random_uuid()` default.

Vercel runs `pnpm db:migrate` before `next build` through `vercel.json`.
The Vercel build uses `MIGRATION_DATABASE_URL`, or its configured
`DATABASE_URL_UNPOOLED` when no explicit migration URL is set. The migration runner
requires this direct URL and holds a session advisory lock before Drizzle reads the migration journal. Concurrent deployments wait.
Drizzle commits the schema conversion and journal entry in one transaction. A
failure rolls back the conversion and stops the build. Later builds skip it.

Before deploying:

1. Back up production and verify that the backup can be restored.
2. Test the migration on a disposable production clone.
3. Verify the direct `MIGRATION_DATABASE_URL` or `DATABASE_URL_UNPOOLED` for each
   Vercel environment. Preview deployments must use a separate database, never
   the production database.
4. Disable application traffic for the cutover. The migration locks and rewrites
   the tables. The old application cannot use UUIDs after the migration commits.
5. Deploy, verify the new application, then restore traffic. Users must sign in
   again because existing JWTs contain integer IDs. Refresh open browser tabs.

If the build fails after the migration commits, keep traffic disabled and fix
forward. Do not promote an older integer-ID deployment against the UUID schema.
A rollback requires the pre-deployment backup and a coordinated application rollback.

Run `pnpm test:db-migration` to verify conversion, transactional rollback, concurrent
migration runners, repeat deployments, UUID defaults, and deletion cascades. This
check creates and removes a disposable workspace-local database under the pinned
mise PostgreSQL cluster. It does not access production.
