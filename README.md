# Shopping List

A personal shopping list app with AI-powered item categorization.

## Stack

- [Next.js](https://nextjs.org/) — framework
- [Prisma](https://www.prisma.io/) + PostgreSQL — database
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
JWT_SECRET="your-jwt-secret"
OPENAI_API_KEY="sk-..."
INVITE_TOKEN="your-secret-token"  # optional, see below
```

## Sign-up & Invite Token

By default, registration is open to anyone. If you set the `INVITE_TOKEN` environment variable, users must provide that token when signing up.

It's a single static token shared with whoever you want to give access — no per-user tokens, no expiration.

## Development

```bash
prisma generate && prisma db push

pnpm dev
```

## Commands

```bash
pnpm build      # build for production
pnpm lint       # run oxlint
pnpm lint:fix   # run oxlint with auto-fix
pnpm fmt        # format with oxfmt
pnpm fmt:check  # check formatting
```
