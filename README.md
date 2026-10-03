# Shopping List

A personal shopping list app with AI-powered item categorization.

## Stack

- [TanStack Start](https://tanstack.com/start) — SSR framework and server functions
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

The app renders initial pages on the server. Route loaders and TanStack Query call typed
`createServerFn` functions for reads and mutations. Database and AI logic stay on the server.
The app does not use React Server Components. Application reads and mutations use server
functions. The `/_sync` WebSocket endpoint only sends account-scoped change notifications.

Use `PORT` to change the development port. Set `ALLOWED_DEV_ORIGINS` to a comma-separated list
of hostnames when you access the development server through another hostname.

To run the production server locally:

```bash
pnpm build
pnpm start --port 3000
```

Vercel builds use Nitro's Vercel preset. Local builds use its Node.js preset.

## Cross-device sync

PostgreSQL triggers notify connected browsers when categories, shopping items, pantry areas,
or pantry items change. Only browsers signed in to the affected account receive the notification.
TanStack Query invalidates its cache and refetches active queries. There is no query polling.
After reconnecting, browsers refetch to recover changes missed while disconnected.

Each tab generates a random source ID in memory. Server-function calls send it in a header,
and write transactions include it in the notification. The server excludes the originating tab,
which already refetches through its mutation hook. Other tabs still receive the change. Reloading
creates a new ID. Source IDs do not authorize access; the authenticated account determines access.

The listener uses one dedicated PostgreSQL connection per active server instance. Set
`DATABASE_URL_UNPOOLED` when `DATABASE_URL` uses transaction pooling. Otherwise, `DATABASE_URL`
must be a direct or session-pooled connection that supports `LISTEN`. Do not use the migration
credential for application subscriptions.

Apply the reviewed `account_changes` migration through the deployment migration job. Vercel
must have Fluid compute enabled for native WebSockets. Connections renew at most every four
minutes to reauthenticate and recover across Function lifetimes.

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
PLAYWRIGHT_PRODUCTION=1 pnpm test:e2e
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
