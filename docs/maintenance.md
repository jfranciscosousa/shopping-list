# Maintenance update

## Scope

Branch: `fs/update-maintenance`, based on `origin/master` at `b1ab5c0`.

Version sources: `.tool-versions`, `package.json`, `pnpm-workspace.yaml`,
`pnpm-lock.yaml`, and `.github/workflows/ci.yml`. Reviewed `vercel.json`, scripts,
hooks, and project documentation. No other runtime manifests, Dockerfiles,
Cloudflare configuration, or lockfiles are tracked.

## Runtime and CI updates

| Item               | Old     | New     |
| ------------------ | ------- | ------- |
| Node.js            | 26.10.0 | 26.13.0 |
| pnpm               | 12.8.2  | 12.18.0 |
| pnpm/action-setup  | 6.0.10  | 6.1.1   |
| actions/setup-node | 7.0.0   | 7.1.0   |

PostgreSQL 18.6, the CI PostgreSQL image, Ubuntu 26.04, actions/checkout 7.0.1,
and tool-versions-action 2.0.0 remain current. CI actions remain pinned to commit hashes.

## Direct package updates

| Package                         | Old             | New           |
| ------------------------------- | --------------- | ------------- |
| @radix-ui/react-alert-dialog    | 1.1.23          | 1.2.1         |
| @radix-ui/react-checkbox        | 1.3.11          | 1.4.1         |
| @radix-ui/react-collapsible     | 1.1.20          | 1.2.1         |
| @radix-ui/react-label           | 2.1.15          | 2.1.17        |
| @radix-ui/react-select          | 2.3.7           | 2.4.1         |
| @radix-ui/react-separator       | 1.1.15          | 1.2.0         |
| @radix-ui/react-slot            | 1.3.3           | 1.5.0         |
| @radix-ui/react-tabs            | 1.1.21          | 1.2.1         |
| @radix-ui/react-toast           | 1.2.23          | 1.3.1         |
| @tanstack/react-query           | 5.104.1         | 5.107.1       |
| @tanstack/react-router          | 1.170.41        | 1.170.46      |
| @tanstack/react-start           | 1.168.60        | 1.169.5       |
| ai                              | 7.0.127         | 7.0.165       |
| bcrypt-ts                       | 9.0.2           | 9.0.3         |
| dotenv                          | 18.0.5          | 18.0.9        |
| jose                            | 6.2.12          | 6.2.16        |
| lucide-react                    | 1.51.0          | 1.70.0        |
| react / react-dom               | 19.3.0          | 19.3.1        |
| zod                             | 4.6.5           | 4.6.7         |
| @babel/core                     | 8.0.6           | 8.1.0         |
| @playwright/test                | 1.63.0          | 1.65.0        |
| @rolldown/plugin-babel          | 0.2.4           | 0.3.0         |
| @tailwindcss/vite / tailwindcss | 4.3.3           | 4.3.5         |
| @types/lodash                   | 4.17.25         | 4.17.27       |
| @types/node                     | 26.6.4          | 26.6.6        |
| @vitejs/plugin-react            | 6.1.1           | 6.2.1         |
| happy-dom                       | 20.14.5         | 21.0.4        |
| nitro                           | 3.0.260903-beta | 3.0.261103-rc |
| oxfmt                           | 0.71.0          | 0.77.0        |
| oxlint                          | 1.86.0          | 1.92.0        |
| vercel                          | 62.2.0          | 65.12.1       |
| vite                            | 8.3.2           | 8.3.6         |
| vitest                          | 5.0.3           | 5.1.0         |

The lockfile includes refreshed transitive dependencies. Updated the two Undici
6.x overrides from 6.29.0 to 6.29.1. Other direct packages are current.
`pnpm outdated --format json` returns `{}`.

## Holds and release-channel exceptions

- `drizzle-orm` and `drizzle-kit`: keep `1.0.0-rc.4`. The latest stable tags
  are `0.45.4` and `0.31.11`. Moving backward would require migration-format
  and API review. The newer `1.0.0-rc.5` is not stable. Do not change the
  existing database baseline as part of dependency maintenance.
- Nitro has no stable release under the `nitro` package name. Updated the
  existing Nitro 3 prerelease to its latest published release candidate.
- Keep major-specific overrides: `brace-expansion` 1.1.21 under minimatch 3,
  minimatch 10.2.6, js-yaml 4.3.2, path-to-regexp 6.3.0/8.4.2, and Undici 6.29.1.
  Their latest majors are 5, 11, 5, 9, and 8. Forcing these majors into Vercel
  or other upstream packages requires separate upstream API compatibility work.
  These overrides use the latest releases in their existing major lines.

## Verification

Passed:

- `mise install`; verified Node 26.13.0, pnpm 12.18.0, and PostgreSQL 18.6.
- `pnpm install --frozen-lockfile`.
- `pnpm typecheck`, `pnpm lint`, `pnpm fmt:check`, and `pnpm db:check`.
- `pnpm build`, including SSR and the local Node server bundle.
- `pnpm test`: 14 files, 63 tests.
- `pnpm test:e2e`: 11 passed, one production-only test skipped.
- `git diff --check`.

The first headless E2E run failed during login hydration: Vite module requests
remained pending until the test timeout. A full rerun with the dependency cache
populated passed without retries. E2E test files remain unchanged.

Install reports missing `@emnapi/core` and `@emnapi/runtime` peers in the optional
WASM toolchain. It also reports an undeclared, resolved Rolldown peer for the
Babel plugin. Native Linux tools, typecheck, tests, and build pass. These warnings
remain; no unused direct dependencies were added to suppress them.

Tests used the guarded workspace-local PostgreSQL databases under `/tmp`.
Did not run `setup:local`, because it writes `.env.local`. Test runners provisioned
and migrated their isolated databases without changing environment files.
Playwright reports and traces were moved outside the checkout to `/tmp`.

No deployment, push, PR, remote database change, secret change, or environment-file
change occurred. Vercel deployment and real AI Gateway access were not tested.
