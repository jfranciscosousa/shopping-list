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

## Neon preview cleanup

The Vercel project `shopping-list` uses the **Vercel-managed Neon integration** with
preview deployment actions enabled. Its connected Neon project is `winter-bird-75963371`.
Vercel's production Git branch is `master`. These settings were verified through read-only
Vercel API requests. The integration's [documented branch name](https://neon.com/docs/guides/vercel-managed-integration)
is exactly `preview/<git-branch>`, including slashes. For example, `fs/example` maps to
`preview/fs/example`. Do not use the `preview/pr-<number>-...` convention from custom branching
workflows. Cleanup resolves the exact name in Neon at runtime; it does not guess a branch ID.

Configure these **GitHub Actions repository secrets** before enabling cleanup:

- `NEON_API_KEY`: a Neon API key with branch read/delete access to this project. Use the
  narrowest scope available. Create it in the Neon Console's API Keys settings after opening
  Neon from Vercel. A database password or Vercel token is not a Neon API key.
- `NEON_PROJECT_ID`: `winter-bird-75963371`. The script rejects any other project.
- `NEON_PRODUCTION_BRANCH_ID`: the actual production database branch ID (`br-...`), verified
  in the Neon Console against Vercel's production connection. This explicit denylist also
  protects production if someone changes its name or default status. Do not supply a preview ID.

No Vercel token or database connection secret is required. Secrets were not created by this change.

`.github/workflows/neon-preview-cleanup.yml` runs on `pull_request_target: closed`, for merged
and unmerged PRs targeting `master`. It checks out only trusted base code, never PR head code. PR fields remain
JavaScript data; they are never interpolated into shell commands or script source. Fork PRs,
reopened PRs, production/default Git refs, and branches shared with another open PR are skipped
or refused. The only possible deletion target is the exact `preview/<closed-PR-head-ref>` match
in the verified project. Ambiguous matches fail. Fresh branch metadata must confirm a non-root,
non-default, non-protected branch, and its ID must differ from the configured production ID.
Neon also refuses deletion of root/default branches and branches with children. Cleanup never
unprotects branches or recursively deletes children. Authentication, rate-limit, and other API
errors fail the job. An absent exact match or branch-level HTTP 404 succeeds without further action.
The branch creation timestamp must be valid and no later than the PR closure timestamp. A surviving
Git ref must still match the closed PR's head SHA. These checks prevent stale reruns from deleting
replacement previews after branch reuse. Immediately before deletion, cleanup repeats the closed-PR,
shared-ref, and Git-SHA checks and verifies that the PR identity and closure did not change.

The workflow is available after it reaches the default branch. It does not clean up older closed
PRs retroactively. A reopened PR needs a new preview deployment to recreate its database.
GitHub state checks and Neon deletion are not an atomic operation. A PR can still reopen or a
shared PR can open in the brief interval after the final check. Concurrent deployment completion
can recreate a branch after cleanup. Inspect these cross-service races manually.
Deleting the database leaves existing Vercel preview URLs without a working database. Vercel's
own later cleanup remains compatible with an already-deleted branch.

Validate without Neon credentials or remote deletion:

```bash
node --test .github/scripts/neon-preview-cleanup.test.cjs
```

The same mock-only checks run in CI. Do not invoke the cleanup script with live credentials
for development validation.

Official references:
[preview cleanup](https://neon.com/docs/guides/vercel-branch-cleanup),
[list branches and pagination](https://api-docs.neon.tech/reference/listprojectbranches),
[branch details](https://api-docs.neon.tech/reference/getprojectbranch),
[delete restrictions](https://api-docs.neon.tech/reference/deleteprojectbranch), and
[GitHub privileged-event safety](https://docs.github.com/en/actions/reference/security/secure-use).

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
