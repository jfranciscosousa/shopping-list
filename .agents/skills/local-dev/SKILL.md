---
name: local-dev
description: Run or validate this Shopping List project's local development environment. Use whenever work involves setup, local PostgreSQL, seeded data, starting a dev server, real AI Gateway validation, browser tests, or resetting test state. Follow this skill even if the request only mentions “run the app”, “test it locally”, or “seed the database”.
---

# Local development

Use one safe, reproducible local stack. The pinned tools in `.tool-versions` are the source of
truth; use mise PostgreSQL, never Docker or a system PostgreSQL installation.

## Bootstrap

From a fresh checkout, run:

```bash
mise install
pnpm install
pnpm setup:local
```

`setup:local` creates a workspace-specific PostgreSQL cluster under `/tmp`, writes safe values to
ignored `.env.local`, migrates, and seeds the development database. Use the fixture account
`demo@example.test` / `demo-password` when authentication is needed.

Start the app with `pnpm dev`. This command is local-only and must not fetch Vercel configuration.
Set `ALLOWED_DEV_ORIGINS` if the app is opened through another development hostname.

## Reset and test

- Use `pnpm db:reset:local` before a manual flow needs a known fixture state.
- Use `pnpm test:e2e` to self-test browser behavior. It recreates an isolated E2E database and
  must never be pointed at a user-supplied or remote `DATABASE_URL`.
- For code changes, run the checks relevant to the change; normally:

  ```bash
  pnpm fmt:check && pnpm typecheck && pnpm lint
  ```

## Real AI Gateway validation

Only when testing real AI behavior, run `pnpm ai:env:pull`. It requires an authenticated, linked
Vercel CLI and writes only `VERCEL_OIDC_TOKEN` to ignored `.env.local`. Do not run it for ordinary
UI, database, or E2E validation. Rerun it if the OIDC credential has expired.

## Safety

The local scripts deliberately reject database URLs that are not the derived workspace-local
development or E2E database. Preserve that guard. Never use `db:pull --init`, reset commands, or
destructive SQL against production without explicit approval and a verified direct migration URL.

Report which local workflow and verification commands ran. Do not expose `.env.local` values or
OIDC tokens in output.
