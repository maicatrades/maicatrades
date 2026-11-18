# Closing capture review — November 18, 2026

Implemented a separate, disabled-by-default GitHub Actions workflow and Node 24
runner using the existing score and breadth handlers. No public endpoint, new
database schema, new data subscription, M122 change or formula change.

Capture: same-session only, 10–99 minutes after the applicable close, breadth
before score, three attempts, repeated schedule slots, transport limited to two
history tables and conditional updates/insert-ignore. Existing final records
are preserved. A row readback must prove a final score linked to the saved
post-close breadth timestamp/value. Invalid/missing coverage or mismatched
provenance causes a failed run rather than a repair.

Monitoring: read-only checks later that evening and the next weekday morning,
failed-run annotations and summaries. Notifications must be enabled in GitHub.
Schedules can be delayed or dropped; these checks are not an independent uptime
monitor and do not guarantee exact-time execution. The exchange calendar expires
after 2028. Yahoo responses, calculation outputs and stored verification pairs
are retained in Actions artifacts for 30 days when the job is enabled.

Validation performed without production calls or writes:
- All 32 trust tests pass, including 9 new closing-capture tests.
- Production resolver passes 9 tests in an isolated checkout with no project
  node_modules, using the external pinned-runtime lookup. No test DB hooks are
  available in this resolver.
- Tests cover EST/EDT, early close, holiday/weekend, Veterans Day, calendar expiry,
  partial coverage, retries, window expiry, missing persistence despite HTTP
  success, preserved finals, stale/future/mismatched records, read-only mode,
  historical/foreign/unconditional-write denial and real Supabase query builders.
- Focused ESLint and TypeScript --noEmit pass. Workflow YAML parses.
- Installer verifies prerequisite source hashes before changing files, backs up
  originals, preserves environment files and does not enable production writes.

Source is published for review with owner authorization. Not performed: schedule
activation, deployment, live capture, production
schema changes or backfills. The runner has not completed a real closing capture;
confirm its first enabled close and following verification before declaring it
operational. The current deployed legacy website remains an independent writer.

Operational procedure: scripts/closing-capture/README.md.
