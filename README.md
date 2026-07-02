# E2E Showcase

[![E2E](https://github.com/apxthexsis/e2e-showcase/actions/workflows/e2e.yml/badge.svg)](https://github.com/apxthexsis/e2e-showcase/actions/workflows/e2e.yml)
[![Playwright report](https://img.shields.io/badge/Playwright-HTML%20report-2EAD33?logo=playwright)](https://apxthexsis.github.io/e2e-showcase/)

A public, customer-facing demonstration of a **production-grade Playwright E2E architecture**: page objects, chained fixtures, centralized locators, tag-based test selection, a one-time auth setup project, and a CI pipeline that only runs the tests affected by a change.

Everything is self-contained — the repo ships **FlowBoard**, a small zero-dependency demo web app (email + OTP login, projects, tasks) that the suite runs against, so `npm ci && npx playwright test` works out of the box with no external services.

## Quick start

```bash
npm ci
npm run e2e:install        # download the Chromium browser (once)
npm run e2e:test           # full suite (Playwright auto-starts the demo app)
```

Other useful commands:

```bash
npm run app:serve          # run the demo app manually at http://127.0.0.1:4173
npm run e2e:test:sanity    # smoke run: only @sanity tests, 1 worker, 1 retry
npm run e2e:test:headed    # watch the browser while tests run
npm run e2e:test:ui        # Playwright UI mode
npm run e2e:test:affected  # run only tests affected by your git diff
npm run e2e:report         # open the HTML report of the last run
```

## What this demonstrates

### 1. Layered architecture (thin specs, fat pages)

```
e2e/
├── setup/        # one-time auth: logs in once, saves storage state for all specs
├── specs/        # thin test files — declare tags, call one page helper
├── pages/        # page objects + Playwright fixture extensions (the business flows)
├── locators/     # centralized data-testid selectors, one file per UI area
├── fixtures/     # static assets (empty storage state)
├── constants/    # stable strings shared between setup and specs
└── utils/        # test-data factory, OTP retrieval
```

Page objects lean on Playwright's built-in auto-waiting (`locator.click()` already waits for visibility and actionability) — no hand-rolled `waitAndClick` wrappers. Explicit `expect(...).toBeVisible()` appears only where it asserts a real state transition, like the OTP step replacing the email step.

Specs stay one-liners because flows live in page objects:

```ts
// e2e/specs/create-project.spec.ts
import { test, createProject } from '../pages/create-project.page';

test(
  'Create project - project appears on the dashboard',
  { tag: ['@sanity', '@ci', '@projects'] },
  async ({ page }) => {
    await createProject(page);
  }
);
```

### 2. Chained fixtures

Fixtures are extended in page files and build on each other. The tasks suite extends the project fixture, so every task spec starts with a freshly created project — no repeated setup code:

```ts
// e2e/specs/manage-tasks.spec.ts
test(
  'Tasks - add a task to a project and complete it',
  { tag: ['@sanity', '@ci', '@tasks'] },
  async ({ page, projectName }) => {
    // projectName fixture creates the project
    await addAndCompleteTask(
      page,
      projectName,
      TestDataFactory.createTaskTitle()
    );
  }
);
```

### 3. One-time authentication (setup project)

The `setup` Playwright project runs first, performs the email + OTP login once, and saves the browser storage state to `e2e/results/.state.json`. The main `chromium` project depends on it and reuses that state, so functional specs never waste time logging in. Auth specs opt out by overriding `storageState` back to `undefined`.

The OTP is fetched from a **test-only API endpoint** (`e2e/utils/otp.ts`). The interface is the point: in production suites I back the very same `fetchOtpCode(email)` contract with **Gmail IMAP polling** (reading real delivered emails), Redis lookups, or a mail-catcher like MailHog — the login flow and every spec stay untouched, only the retrieval implementation swaps.

Tests are **parallel-safe by design**: every spec generates its own user/project/task data through the test-data factory, so nothing is shared between workers. That's why CI runs with multiple workers (`workers: 2` + `fullyParallel`) instead of falling back to a single-worker "safe mode".

### 4. Tag-based selective execution

Every test declares tags (`@sanity`, `@ci`, `@auth`, `@projects`, `@tasks`, `@app-health-check`). `e2e/tag-mapping.json` maps source paths to tags, and `scripts/get-affected-tags.ts` turns a git diff into a Playwright `--grep` pattern:

```bash
node scripts/get-affected-tags.ts origin/main --ci
# → ((@auth|@projects|@tasks).*@ci|@ci.*(@auth|@projects|@tasks))
```

On pull requests, CI runs **only the affected tests**; on `main` it runs the full suite. Changing only the CSS runs just the health check; touching the server runs the auth, projects and tasks suites.

### 5. CI pipeline

`.github/workflows/e2e.yml` installs dependencies with npm cache, caches the Playwright Chromium binary, runs the affected (PR) or full (main) suite with 2 parallel workers, and uploads the HTML report as an artifact on every run — pass or fail.

On every push to `main`, a second job publishes the HTML report to **GitHub Pages**, so the latest run is always browsable at [apxthexsis.github.io/e2e-showcase](https://apxthexsis.github.io/e2e-showcase/). (One-time setup: repo Settings → Pages → Source: "GitHub Actions".)

## The demo app: FlowBoard

A deliberately tiny project/task tracker (`app/`) built with zero dependencies:

- **Email + OTP sign-in** — mirrors passwordless auth flows; codes are 6-char alphanumeric with a 5-minute TTL
- **Projects dashboard** — create projects in a modal, cards update live
- **Tasks** — add tasks to a project and check them off
- In-memory store, boots in milliseconds, `GET /health` for readiness checks

It exists only to give the E2E suite something realistic to test — the architecture is the product here.

## License

MIT
