# Maintenance update: 2026-11-18

`fs/update-maintenance` started from `origin/master` at `2bb0187`. The repository
tracks one pnpm lockfile and one GitHub Actions workflow.

## Runtime and build settings

- Keep `.tool-versions` and `package.json` (`packageManager`) in sync for pnpm.
  CI reads Node and pnpm from `.tool-versions`. Match the CI PostgreSQL image
  tag to the PostgreSQL version in `.tool-versions`.
- `vercel.json` runs migrations before the build and does not set a Node
  version. Hosted Vercel runtime settings were not verified.

## Versions

| Item                    | Before  | After   |
| ----------------------- | ------- | ------- |
| Node.js                 | 26.13.0 | 26.13.1 |
| pnpm                    | 12.18.0 | 12.21.0 |
| PostgreSQL and CI image | 18.6    | 18.7    |
| TanStack Query          | 5.107.1 | 5.108.0 |
| AI SDK                  | 7.0.165 | 7.0.176 |
| dotenv                  | 18.0.9  | 18.0.10 |
| jose                    | 6.2.16  | 6.2.17  |
| lucide-react            | 1.70.0  | 1.75.0  |
| Babel core              | 8.1.0   | 8.1.2   |
| Rolldown Babel plugin   | 0.3.0   | 0.3.1   |
| Vite React plugin       | 6.2.1   | 6.3.0   |
| Playwright              | 1.65.0  | 1.65.1  |
| lint-staged             | 17.6.0  | 17.6.1  |
| oxfmt                   | 0.77.0  | 0.79.0  |
| oxlint                  | 1.92.0  | 1.94.0  |
| Vercel CLI              | 65.12.1 | 66.1.0  |
| Vitest                  | 5.1.0   | 5.1.1   |

`pnpm outdated` shows no newer stable direct packages. The action SHA pins
already match checkout `v7.0.1`, setup-node `v7.1.0`, pnpm/action-setup `v6.1.1`,
and tool-versions-action `v2.0.0`. The workflow still uses Ubuntu 26.04.

## Holds and overrides

- Drizzle ORM and Kit: kept `1.0.0-rc.4`. ORM `rc.5` reapplied migrations to an
  isolated `rc.4` database without changing its schema. Kit `rc.5` failed
  `db:check` on the tracked snapshot and requested `drizzle-kit up`. Review the
  snapshot conversion and test fresh and existing databases before updating.
  The stable tags (`0.45.4` and `0.31.11`) predate the tracked 1.0 migration line.
  Checked 2026-11-18.
- Nitro: `3.0.261103-rc` is current. Recheck when `nitro` ships a stable release.
  Checked 2026-11-18.
- The optional Rolldown WebAssembly binding still pins `@emnapi/core` and
  `@emnapi/runtime` to `2.0.0-beta.2`. Both packages have a newer `beta.3`, but
  the binding still selects `beta.2`. Recheck when the binding updates its pins.
  Checked 2026-11-18.
- Babel still selects `gensync` `1.0.0-beta.2` and `@jridgewell/gen-mapping`
  `0.4.0-beta.0`. Neither has a newer stable release. Vercel CLI's dependency
  graph still selects `@workflow/serde` `4.1.0-beta.2`, `micro` `9.3.5-canary.3`,
  and Rolldown `1.0.0-rc.1`, despite newer stable releases. Recheck when the
  upstream parents update these pins. Checked 2026-11-18.
- Dropped both `source-map-js` overrides; both edges still resolve `1.2.2`.
  Dropped the `brace-expansion` overrides and refreshed the lock to `1.1.22` and
  `5.0.13`. Dropped obsolete `vercel>undici` and `vercel>smol-toml` edges.
- Tested each old override independently. Retained the following Vercel tool
  overrides because the parent packages still select older versions. Remove
  them when the corresponding parent selects a fixed version. Checked 2026-11-18.

| Parent                                                | Dependency and version                                 |
| ----------------------------------------------------- | ------------------------------------------------------ |
| `@vercel/container`                                   | `tar` 7.5.23, `smol-toml` 1.9.1                        |
| `@vercel/static-config`                               | `ajv` 8.20.0                                           |
| `@vercel/python-analysis`                             | `minimatch` 10.2.6, `js-yaml` 4.3.2, `smol-toml` 1.9.1 |
| `@vercel/rust`                                        | `smol-toml` 1.9.1                                      |
| `@vercel/node`                                        | `path-to-regexp` 6.3.0, `undici` 6.29.1                |
| `@vercel/remix-builder`                               | `path-to-regexp` 6.3.0                                 |
| `@vercel/backends`, `@vercel/hono`, `@vercel/express` | `path-to-regexp` 8.4.2                                 |
| `@vercel/cli-support`                                 | `smol-toml` 1.9.1 (new override)                       |
| `@vercel/cli-config`                                  | `zod` 4.6.7 (new override)                             |

## Audit

`pnpm audit` fell from **25 to 22** findings: high 9 → 8, moderate 13 → 11,
low 3 → 3. All findings were transitive. The `smol-toml` override closes
three CLI findings. The `zod` override fixes the 4.x path; the 3.x paths remain.
GitHub Dependabot reported 17 open alerts on `master`, before these local changes.

| Dependency                | Remaining finding                                                                                                                                  | Scope and blocker                                                                                                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `picomatch` 2.3.2 / 4.0.7 | [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)                                                                           | 4.0.7 is the one production-graph finding, through TanStack Start's tooling. No patched release. The local production bundle inspection did not find `picomatch`; hosted reachability was not verified. 2.3.2 is CLI-only. |
| `undici` 5.29.0           | 16 advisories, listed below                                                                                                                        | Vercel CLI only. `@vercel/cli-support` pins 5.29.0; no patched 5.x release.                                                                                                                                                |
| `@fastify/busboy` 2.1.1   | [GHSA-x8mw-p69m-v3mx](https://github.com/advisories/GHSA-x8mw-p69m-v3mx), [GHSA-gxm5-99cw-xjw9](https://github.com/advisories/GHSA-gxm5-99cw-xjw9) | Vercel CLI through Undici 5. The fix is in 3.x.                                                                                                                                                                            |
| `zod` 3.22.4              | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)                                                                           | Vercel CLI builder dependencies use Zod 3. The fix is in 4.x; the application's Zod is patched.                                                                                                                            |
| `glob` 13.0.7             | [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4)                                                                           | Vercel CLI builders pin `@vercel/nft` 1.10.0, which uses Glob 13. Newer NFT uses fixed Glob 14 but the builders do not select it.                                                                                          |
| `minimatch` 10.2.6        | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)                                                                           | Vercel CLI through Glob 13 and Python analysis. The fix is in 11.x.                                                                                                                                                        |

Undici advisories: `GHSA-g9mf-h72j-4rw9`, `GHSA-2mjp-6q6p-2qxm`,
`GHSA-vrm6-8vpv-qv8q`, `GHSA-v9p9-hfj2-hcw8`, `GHSA-4992-7rv2-5pvq`,
`GHSA-p88m-4jfj-68fv`, `GHSA-g8m3-5g58-fq7m`, `GHSA-8xcm-r25x-g524`,
`GHSA-m8rv-5g2x-5cg5`, `GHSA-v3r7-h72x-cjcm`, `GHSA-35p6-xmwp-9g52`,
`GHSA-r53p-7pc4-xj5r`, `GHSA-2m5v-pch6-74hx`, `GHSA-qrxm-fqhp-jwvm`,
`GHSA-9fm3-97px-rjf6`, `GHSA-vxpw-j846-p89q`.

Recheck the CLI findings when Vercel updates its dependency ranges. Do not
force incompatible major versions into the CLI graph. Recheck Picomatch when a
patched release ships or TanStack Start no longer brings in an affected version.
Checked 2026-11-18.

## Verification

Run both `pnpm test:e2e` and `PLAYWRIGHT_PRODUCTION=1 pnpm test:e2e` headless.
Set a unique `PLAYWRIGHT_BASE_URL`. The development run skips one
production-only test. The guarded E2E runner does not write `.env.local`;
`pnpm setup:local` does.

The baseline passed frozen install, format, typecheck, lint, migration check,
and both builds. Two authentication unit tests timed out at 5 seconds. The
headless development layout test passed on retry; one production-only test was
skipped. All 12 baseline production E2E tests passed.

The final run passed frozen install, format, typecheck, lint, migration check,
`db:generate` (no changes), both builds, and all 63 unit tests. Development E2E
passed 11 tests and skipped the production-only test. Production E2E passed all
12 tests. The local CI E2E command passed 11 tests with the same skip.
All final database checks used isolated PostgreSQL 18.7 databases.

The local Vercel CLI version and `env pull --help` commands passed. The actual
environment pull and AI Gateway calls were not run.

No push, deployment, hosted CI run, production write, or `.env` change.
