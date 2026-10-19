# MTR automatic scan setup — October 15, 2026

The code is prepared. Scheduled scanning is NOT active merely by extracting this ZIP.
Complete the steps below and verify a successful real Actions run before relying on it.

## 1. Install the files

Extract the contents into `C:\Users\Barto\maicatrades`, merging the folders and replacing the included source files.
Keep your existing `.env.local` and `research/mtr/journal` folder. Neither is included in this patch.
Back up the journal before the one-time handoff. Keep the local backup after seeding.

## 2. Apply the database setup

In the existing Supabase project's SQL Editor, run `research/mtr/schema.sql` if it has not already been applied.
Then run `research/mtr/automation-schema.sql`. This creates a private `mtr-journal` Storage bucket.
Do not add anonymous or authenticated-client Storage policies to that bucket.
The existing service role key handles checkpoints and publication; the private Pro API still checks login.

## 3. Test locally and seed your existing journal once

From PowerShell in the MaicaTrades folder:

```powershell
node --test research/mtr/test.mjs research/mtr/automation.test.mjs
node research/mtr/automate.mjs seed
```

The seed command reads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY` from your environment or `.env.local`.
It uploads and verifies the existing journal and dated archives. It refuses to overwrite an existing cloud journal.
Do not delete the cloud object to work around a seeding error; investigate first.
After seeding, stop running the local `scan` and `publish` commands: the cloud copy becomes the source of truth.
`automate.mjs run` intentionally requires an empty journal folder; use Actions, not your seeded local working folder.

## 4. Add three GitHub Actions repository secrets

Open your repository → Settings → Secrets and variables → Actions → New repository secret.
Copy these values from your local configuration without committing them:

- `EODHD_API_TOKEN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

The connected GitHub copy inspected during this work was last updated September 23.
The current scanner, its frozen dependency, and Pro files must be pushed along with the workflow.
The patch includes those dependencies; adding only the YAML workflow to the older repository will not work.

After reviewing `git status`, stage these paths (the included `.gitignore` excludes the journal):

```powershell
git add .gitignore .github/workflows/mtr-scan.yml research/mtr research/historical-reconstruction/frozen.mjs src/app/api/pro/mtr src/app/pro/mtr MTR-AUTOMATION-SETUP.md
git diff --cached --stat
```

Confirm no `.env` files, journal JSON, raw data, or credentials are staged. Commit and push through your usual workflow.
The scheduled workflow must reach the repository's default branch. Push and PR events only run the tests.

## 5. Activate and verify

In GitHub Actions, open **MTR automatic scan and Pro publication**, choose **Run workflow**, and run the default branch.
Check that both `test` and `scan-and-publish` succeed. A passing test job alone does not mean a scan ran.
Deploy the updated app using your normal Cloudflare process (`npm run build`, then your usual deployment command/environment).
Open `/pro/mtr` and confirm:

- Automation is **healthy** with a fresh successful scan/publication timestamp.
- The latest completed session is correct.
- Scan history shows any recovered sessions. Late candidates are retrospective and excluded from forward returns and accounts.

Until this real run passes, automation remains unverified. Do not treat old journal data or zero signals as proof of a successful scan.

## Schedule and behavior

Two attempts every day, including weekends:

- 03:35 UTC: 11:35 PM EDT / 10:35 PM EST, after the scanner's 10 PM ET cutoff.
- 10:35 UTC: 6:35 AM EDT / 5:35 AM EST, an early-morning retry.

GitHub schedules can be delayed. Both runs share one concurrency group and never intentionally overlap.
Each run uses about 248 EODHD requests, even if the latest session was already scanned. Budget for roughly 496 requests/day.
EODHD availability, entitlements, rate limits, and scheduling delays can still prevent a timely signal.
The entry-window gate continues to reject late signals; it does not place trades.
If you use GitHub's failure notifications, enable them for this workflow in your account's Actions notification settings.
Scheduled workflows in inactive public repositories may be disabled by GitHub; check Actions if the Pro heartbeat becomes stale.

The runner restores the compressed private journal, scans all missing provider sessions since `lastSession`, saves and verifies the checkpoint, then publishes.
Successful no-change runs republish safely and refresh the automation heartbeat without revising frozen observations.
The checkpoint includes the full ledger and dated input archives; it is not stored in git, Actions cache, or Actions artifacts.
The private bucket has a 100 MiB per-object limit; a checkpoint upload failure fails the run and prevents publication.
Keep a periodic independent backup of the private checkpoint for disaster recovery.

Pro shows the last successful scan AND publication, the latest attempt, a controlled failure message, and a warning after 30 hours without success.
It also flags a completed-session age over five days. The session-age threshold is a coarse safety check, not an exchange-holiday calendar or a promise that every recent session is present.
If the status write itself is unavailable, the previous heartbeat eventually becomes stale.
If the app/API cannot be reached, it cannot display current status.

## Live provider issue observed during validation

The real scan on October 15 stopped at `GOOGL splits: HTTP 402`.
The complete scan did not finish; no live October 13–14 recovery or publication was performed.
Check EODHD account access and remaining API allowance for the splits endpoint before relying on the scheduled job.
The code preserves corporate-action handling rather than skipping failed split data.
The automatic failure message now exposes this safe HTTP error without exposing the token or request URL.

## Validation

- Frozen trading-rule tests plus automation integration tests pass.
- Integration tests use simulated provider bars to verify October 13–14 recovery, late-candidate exclusion, repeat-run safety, checkpoint ordering, safe seeding, clean-runner retries, provider errors, and failure/stale status.
- TypeScript check passes.
- Production build result is recorded in the delivered validation note.
- Real GitHub scheduling, cloud checkpoint transfer, and live Pro publication still require the activation steps above.

Trading formulas and engine/frozen-definition files are unchanged from your October 15 source.
The Economic Calendar ingestion issue is separate and is not fixed by this MTR patch.
