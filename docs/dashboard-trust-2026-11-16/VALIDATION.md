# Validation checkpoint

- Existing research/automation baseline: **44 passed, 0 failed**. No files in research/ or MTR workflow configuration were changed.
- New trust/prefill suite (`npm run test:trust`): **11 passed, 0 failed**.
- TypeScript `--noEmit`: **passed**; final production build also passed TypeScript checking.
- Production build: **passed** with local Linux-only native dependencies after final API consistency edits.
- Focused ESLint: **0 errors**, two pre-existing unused `history` variable warnings in market-breadth route. This is not a claim that repository-wide lint is clean.
- `git diff --check`: passed.
- Browser/responsive check: **blocked, not passed**. Chromium is installed but cannot launch because the container denies its process-singleton socket (`Operation not permitted`). Initial Playwright bundled browser was also absent. No production route was called during this attempt. The optional fixture-only `tests/dashboard-browser.cjs` checks 1440px/390px layouts, single ticker list and long/short prefill; run it in an environment that permits Chromium before approving release.

## Commands

```bash
npm run test:trust
node --test research/mtr/*.test.mjs research/historical-reconstruction/test.mjs
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

This execution environment needed direct Node invocation for the uploaded Windows `.bin` launchers and matching Linux native packages outside the repository. A clean Linux `npm ci` should select native packages normally; no production dependency versions were changed.

Optional UI check (with Playwright installed, a local server started, and suitable development credentials):

```bash
TEST_BASE_URL=http://127.0.0.1:3101 node tests/dashboard-browser.cjs
```

All browser `/api/**` requests are intercepted with fixtures. Pro UI behind authentication has not been visually validated; its auth/data contract is covered by deterministic tests. Native API writes are mocked in tests. No test requires production database writes.
