# Dashboard closing capture

Status: prepared and tested locally; published for pull-request review only. Not enabled or deployed.

This job is separate from MTR. It runs the existing Market Breadth handler first,
then the existing Market Score handler in an isolated Node 24 process. It does
not call deployed website APIs, add an endpoint, change M122 or change formulas.
No schema migration or historical repair is included.

## Controls

- Writes require both `capture` and `CLOSING_CAPTURE_ENABLED=true`, with read-only
  preview off. The transport restricts reads/writes to the two market-history
  tables, blocks RPC/other services and blocks writes for other dates.
- Capture runs only 10 through 99 minutes after the exchange close. The shared
  2025–2028 calendar handles DST, holidays and early closes; unknown years fail.
- Three attempts with 10/20-second delays; later scheduled runs provide further
  retries. Every retry checks the clock again. Calls outside the window cannot
  become historical backfills.
- 122/122 stock coverage and the existing handler's same-session checks are
  required. Score calculation retains its all-14-symbol/all-11-sector guards.
- Success requires a stored final score plus matching, timestamped post-close
  breadth. HTTP success alone is insufficient. Old/mismatched fallback values
  cannot pass. Valid finals are no-ops; inconsistent finals are reported for
  review, never replaced. Existing immutable-write helpers remain in force.
- Fresh Node fetches avoid the deployed Next/ISR cache. Provider JSON, calculation
  responses and stored verification pairs are saved in the Actions evidence
  artifact for 30 days. These are market data; no credential headers are saved.
  This adds evidence for future captures, not for past records.
- Verification after the capture window and at 12:17 UTC weekdays checks the
  completed session without calling providers or sending any mutation. It can
  identify a missed capture on the following weekday.

## Local review (safe)

From the review project root:

```powershell
npm run test:trust
node --import ./scripts/closing-capture/register.mjs ./scripts/closing-capture/run.mjs plan
```

`plan` needs no credentials and performs no network operations. Do not run
`capture` locally with production credentials as a preview test. Existing preview
scripts and environment files are preserved.

## Activation after reviewing the concrete patch

1. Publish this workflow and its complete calculation source together to the
   repository's default branch. Do not install only the workflow against old
   unrestricted write handlers. Source publication is authorized for review; merging and enabling the job remain separate steps.
2. Existing repository secrets `NEXT_PUBLIC_SUPABASE_URL` and
   `SUPABASE_SECRET_KEY` are reused; no key rotation or permissions change needed.
3. In GitHub Actions notification settings, enable failed-workflow notifications
   for the account that edits the cron schedule. A red run/annotation is automatic;
   email/web delivery depends on the account's notification settings.
4. Set repository variable `DASHBOARD_CLOSING_CAPTURE_ENABLED` to `true` to enable
   the job. Without it the capture job remains skipped. First run manually with
   `verify` to inspect the existing completed-session state; old gaps can cause
   the expected failure. At the next eligible close, confirm a capture receipt.
5. Check that the next weekday's verification is green and the artifact contains
   today's provider inputs and matching saved final. Only then call it operational.

To stop writes, set the repository variable to `false` or disable the workflow.
Existing website writers are independent: local preview and this job's switch do
not disable the currently deployed website or MTR.

GitHub schedules can be delayed or dropped, so this is not a guarantee of an
exact-time close or an independent uptime service. The repeated slots and next
weekday check reduce missed captures but cannot alert if all workflows stop
running. Renew the calendar before 2029 and review failures rather than inventing
missing finals. Artifacts expire after 30 days; export them if longer retention
is needed. These captures are post-close observations, not official exchange
closing-auction certification.

References:
https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
https://docs.github.com/en/subscriptions-and-notifications/how-tos/managing-github-actions-notifications
