# MaicaTrades read-only market-data preview

This change is for the owner's separate local review copy. No deployment, merge, database migration, production record correction or credential change has been performed.

## What the mode protects

With `MAICATRADES_READ_ONLY_PREVIEW=true`, the website's shared Supabase admin client permits only GET/HEAD table reads at its configured database origin. It denies insert/upsert/update/delete requests, RPC calls (including GET RPC), storage operations, admin-auth operations and redirects before network transmission. Score and breadth routes also skip their normal persistence paths. Trade Idea serves the saved weekly record (or latest prior record), without fetching quotes, scanning, upgrading entry methodology, creating a record or updating outcomes. Its price and status are explicitly labeled as recorded values.

The mode does not grant database-level read-only permissions. It is an application safeguard for the market-data client used by the inspected website routes. Other deployed sites, scheduled MTR/research scripts, external clients and database triggers are outside its scope. Authentication/session clients are separate and are not covered by this market-record guard; do not use production login as part of this public-dashboard check. Production authentication permissions are unchanged.

## Install and verify before adding real connection values

The ZIP installer copies only the included source/test files into the current MaicaTrades review project. It backs up replaced files and existing environment flag files into a unique system temporary folder. No package or dependency changes are needed. It does not touch MarketTicker.tsx or MarketHero.tsx, preserving the owner's verified scrolling and spacing fixes.

Setup preserves existing environment file contents while adding `MAICATRADES_READ_ONLY_PREVIEW=true` to `.env.production.local` and `.env.development.local`. These local flags remain enabled for ordinary build/start/dev commands. A deliberate process environment override could supersede these files; use the dedicated launch commands below, which force the flag true in the child process.

1. Stop the local server and save/close any unsaved editors for files being replaced.
2. Install the ZIP from the project root using its `install.cjs`.
3. Keep the dummy connection values for now. Run `npm run test:trust`: 18 tests should pass.
4. Run `node .\read-only-preview\run.cjs build`, then `node .\read-only-preview\run.cjs start`.
5. Open `http://127.0.0.1:3000/api/preview-status`. Require `readOnlyPreview: true` and guard version `database-read-only-v1` before opening real market-data connections.
6. The dashboard should display the read-only preview banner. Dummy credentials still prevent database-backed content from loading; this is expected at this stage.

Only after those checks should the owner configure the local review copy with their existing connection values. Do not paste credentials into chat, screenshots, source code or a shared ZIP. No actual data connection is included in this patch. A fresh build is needed after changing NEXT_PUBLIC environment variables; it must still use read-only mode.

## Verification in this change

- 18 deterministic tests pass: 11 existing trust/prefill tests plus seven preview tests.
- Tests exercise actual Supabase query builders and the configured admin client against a fake transport. Writes, GET RPC and storage uploads reach zero underlying network calls in preview.
- Saved-record Trade Idea route tested with a write-throwing fake client and a provider-fetch trap. No new scans, lifecycle changes or provider refreshes occurred; missing records remain unavailable.
- Status endpoint is dynamic/no-store; disabled-mode pass-through is tested.
- TypeScript and focused ESLint checks pass. Final production-build result is recorded in the delivery summary.
- These automated checks do not establish correctness of real market inputs or historical scores. That audit follows after the owner verifies this guard locally.

## Rollback and scope

The installer prints the backup directory. It records which files existed before installation, including existing local mode flag files. Restore those originals if rolling back; do not indiscriminately delete environment files that may contain the owner's other configuration. No historical database values were changed, so there is no database rollback.

M122 membership, frozen scoring/breadth/regime formulas, research outputs and MTR rules are unchanged. No external API, service subscription or new npm dependency is introduced.
