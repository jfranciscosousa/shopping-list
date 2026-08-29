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
pnpm install
```

Set up your environment variables:

```
DATABASE_URL="postgresql://..."
 SECRET_KEY_BASE="your-jwt-secret"
OPENAI_API_KEY="sk-..."
INVITE_TOKEN="your-secret-token"  # optional, see below
```

## Sign-up & Invite Token

By default, registration is open to anyone. If you set the `INVITE_TOKEN` environment variable, users must provide that token when signing up.

It's a single static token shared with whoever you want to give access — no per-user tokens, no expiration.

## Development

```bash
pnpm db:pull # only when baselining an existing database
pnpm db:generate
pnpm db:migrate

pnpm dev
```

## Commands

```bash
pnpm build      # build for production
pnpm db:check   # validate committed migrations
pnpm test:e2e   # run signup and login browser tests
pnpm lint       # run oxlint
pnpm lint:fix   # run oxlint with auto-fix
pnpm fmt        # format with oxfmt
pnpm fmt:check  # check formatting
```

Before running E2E tests, install the Chromium browser and its system dependencies:

```bash
pnpm exec playwright install --with-deps chromium
```
