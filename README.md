# Shopping List

A personal shopping list app with AI-powered item categorization.

## Stack

- [Next.js](https://nextjs.org/) — framework
- [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL — database
- [TailwindCSS](https://tailwindcss.com/) — styling
- [TanStack Query](https://tanstack.com/query) — server state
- [Vercel AI SDK](https://sdk.vercel.ai/) — AI integration

## Setup

```bash
mise install
pnpm install
pnpm setup:local
```

This project uses the PostgreSQL version pinned in `.tool-versions` through
[mise](https://mise.jdx.dev/). Do not use Docker or a system PostgreSQL installation. Local
database files live outside the repository under `/tmp/shopping-list`; each checkout derives its own
port and database names, so concurrent worktrees do not conflict.

`pnpm setup:local` starts PostgreSQL, creates `.env.local` if necessary, migrates the
workspace-local database, and loads deterministic fixtures. It never targets a remote database.

Sign in with:

```text
email: demo@example.test
password: demo-password
```

Start the application:

```bash
pnpm dev
```

## Local database

Reset the development database to the deterministic fixtures:

```bash
pnpm db:reset:local
```

The reset and seed commands refuse any URL other than the derived local database for the current
checkout. Manage the local PostgreSQL process with:

```bash
pnpm db:local:start
pnpm db:local:status
pnpm db:local:stop
```

## AI Gateway

The application uses Vercel AI Gateway through `VERCEL_OIDC_TOKEN`. To exercise real AI behavior,
authenticate and link the Vercel CLI to the intended project, then run:

```bash
pnpm ai:env:pull
```

The command downloads Vercel environment data to a temporary file, copies only
`VERCEL_OIDC_TOKEN` to `.env.local`, and deletes the temporary file. It does not alter local
database settings or copy other Vercel variables into the local environment. OIDC credentials may
expire; rerun the command when an AI Gateway request is rejected. The app otherwise runs without
the token, but AI-assisted flows require it.

## Browser tests

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

`test:e2e` starts local PostgreSQL and recreates/migrates a separate workspace-local E2E database
before launching Playwright. It never uses the development database or a database URL from your
shell.

## Other commands

```bash
pnpm build      # build for production
pnpm db:check   # validate committed migrations
pnpm lint       # run oxlint
pnpm lint:fix   # run oxlint with auto-fix
pnpm fmt        # format with oxfmt
pnpm fmt:check  # check formatting
```

## Sign-up & Invite Token

By default, registration is open to anyone. If you set the `INVITE_TOKEN` environment variable,
users must provide that token when signing up. It is a single static token shared with people you
want to invite; it does not provide per-user tokens or expiration.
