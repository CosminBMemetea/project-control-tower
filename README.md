# Project Control Tower

A portfolio governance and reporting platform for tracking multiple projects
against a shared set of goal tracks — environment setup, planning, meeting
cadence, reporting, risk, and delivery health — with a Portfolio Overview
that gives a fast, at-a-glance read across the whole portfolio.

It's built to be deployed as-is by any team: rename it, restyle it, point it
at your own projects, and it's yours. Nothing in the UI is hardcoded to a
specific company or industry — see [Branding & customization](#branding--customization)
below.

## Features

- **Portfolio Overview** — goal coverage, RAG status, allocated FTE, open
  risks, and a Project Health "spider web" radar chart for every project,
  plus a Missing Items list of what still needs attention.
- **Per-project tracking** across 6 configurable goal tracks: Environment
  Setup, Planning & Tracking, Meeting Cadence, Reporting Checklist, Periodic
  Reporting, and Execution Assurance — each with an evidence link and a
  0–120% coverage level.
- **Risk Register** — impact/probability/status per risk, with a mitigation
  plan and portfolio-wide high-severity rollup.
- **Project Health** — 6-dimension (Scope/Schedule/Cost/Risk/Quality/
  Resources) 1–5 scoring rendered as a radar chart, with per-dimension notes.
- **Meeting Map** — recurring meetings with day/time/recurrence, status
  (Active/Missing/Needs update), and next-occurrence tracking.
- **Reporting** — retroactive, dated reports built from a fully customizable
  template (add/rename/reorder sections with no code changes), plus a
  Monthly Consolidated Summary across the whole portfolio.
- **Reporting Checklist** — a 10-question checklist sendable to any email
  address via a tokenized link (no login required to respond); works with
  zero configuration via Copy Link / mailto, or automatically via SMTP if
  configured.
- **Monitoring** — a simpler, non-emailed set of governance checkboxes per
  project.
- **Approvals** — a configurable executive/manager sign-off step per project.
- **Settings** — app info at a glance, one-click full data export, and
  password-protection status.

## Quick start (local development)

Requires Node.js 20+.

```bash
npm install                # also runs `prisma generate`
cp .env.example .env       # DATABASE_URL is the only thing you truly need
npm run db:setup           # runs migrations, then seeds sample data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app uses SQLite by default (`dev.db`, created automatically) — there's
nothing else to install or provision to try it out. It's wide open by
default (no login) — see [Simple password protection](#simple-password-protection)
to lock it down.

### Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the codebase |
| `npm run db:migrate` | Apply Prisma migrations (interactive, dev) |
| `npm run db:seed` | Re-run the seed script (safe to re-run — upserts) |
| `npm run db:setup` | Migrate + seed in one step |

## Environment variables

All configuration lives in `.env` (copy `.env.example` to get started — it
documents every variable). Nothing except `DATABASE_URL` is required.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | SQLite connection string, e.g. `file:./dev.db` |
| `APP_NAME` | No | Overrides the app name shown in the sidebar, browser tab, and outgoing emails |
| `APP_DESCRIPTION` | No | Overrides the short tagline under the app name |
| `APP_PRIMARY_COLOR` | No | Hex color, e.g. `#2563eb`, to theme the app's accent color |
| `APP_LOGO_URL` | No | Path or URL to a logo image shown in the sidebar |
| `NEXT_PUBLIC_APP_URL` | No | Absolute base URL, used to build links in Reporting Checklist emails; auto-detected from the request in dev |
| `APP_PASSWORD` | No | Shared password gating the whole app; leave unset to keep it open |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | No | Lets the app send Reporting Checklist emails itself instead of relying on Copy Link / mailto |

Since these are all plain (non-`NEXT_PUBLIC_`) env vars read only on the
server, none of them — including a configured `APP_PASSWORD` — ever ship to
the browser bundle.

## Branding & customization

Everything below is configuration, not code — no need to hunt through
components to make this feel like your own tool.

### App name, description, color, logo

Edit **`config/app.ts`**:

```ts
export const APP_CONFIG: AppConfig = {
  name: "Project Control Tower",
  shortDescription: "Portfolio governance & reporting",
  primaryColor: undefined, // e.g. "#2563eb" — optional
  logoUrl: undefined,      // e.g. "/logo.svg" — optional
};
```

Or override any of these per-deployment without touching source, via env
vars (see `.env.example`):

```
APP_NAME="Acme Program Office"
APP_DESCRIPTION="Acme's project governance hub"
APP_PRIMARY_COLOR="#7c3aed"
APP_LOGO_URL="/logo.svg"
```

If no `logoUrl` is set, the sidebar shows a generated badge using the app
name's first letter instead — there's always something reasonable to look
at with zero configuration.

### Goal track names

The 6 goal tracks (and the "Executive Approval" stretch tier) shown
throughout the app are named in **`config/goals.ts`**. Rename the label text
freely to match your organization's own process names — just don't rename
the `GOAL_TYPES` keys once you have real data, since those are the stable
identifiers stored in the database.

### Projects & approvers

- **`config/projects.ts`** — the project roster. `prisma/seed.ts` reads this
  file to create (or update) projects; it never deletes one, so removing an
  entry here doesn't remove it from an existing database. Ships with
  placeholder sample projects — replace them with your own.
- **`config/approvers.ts`** — the list of approvers required to sign off on
  the Executive Approval tier for every project.

After editing either file, run `npm run db:seed` to apply the changes (see
[Load Projects](#load-projects) below).

## Database

SQLite via Prisma, with a custom `better-sqlite3` driver adapter. The
schema lives in `prisma/schema.prisma`.

### Load Projects

Adding, renaming, or removing entries in `config/projects.ts` or
`config/approvers.ts` doesn't touch the database by itself — run the seed
script to apply the change:

```bash
npm run db:seed
```

This is safe to re-run any time: existing projects (matched by `code`) are
updated in place, new entries are created, and nothing already in the
database is ever deleted by the seed script.

### Reset Database

To wipe the database back to a clean slate (drops all data, re-applies
every migration, then re-seeds from `config/projects.ts` /
`config/approvers.ts`):

```bash
npx prisma migrate reset
```

This is destructive and cannot be undone — use
[Export data](#export-data) first if you want a backup of what's there.

### Changing the schema

```bash
# edit prisma/schema.prisma, then:
npx prisma migrate dev --name describe_your_change
```

For a production deploy, use `npx prisma migrate deploy` instead (applies
existing migrations non-interactively; doesn't create new ones).

Swapping to Postgres/MySQL later just means changing `datasource.provider`
in `schema.prisma`, updating `DATABASE_URL`, and swapping the driver
adapter in `src/lib/prisma.ts`.

## Export data

**Settings → Export data** (`/settings`) downloads a single JSON file with
every project and all of its related data — reports, risks, goal progress,
meetings, checklist submissions and answers, compliance checks, health
scores, and more — plus the shared checklist/monitoring question sets and
the report template.

Use this before resetting the database ([above](#reset-database)) or before
moving to a new environment, so nothing is lost. The same data is also
reachable directly at `GET /api/export`, which is covered by password
protection like the rest of the app if `APP_PASSWORD` is set.

## Simple password protection

Set `APP_PASSWORD` in `.env` to require a password before anyone can open
the app:

```
APP_PASSWORD="choose-a-demo-password"
```

- Leave it unset (or empty) and the app stays fully open — this is the
  default, so nothing changes until you opt in.
- When set, every route requires the password, entered once at `/login`;
  a browser cookie keeps you signed in after that (30 days). Use **Log
  out** at the bottom of the sidebar to end the session.
- The one exception is the Reporting Checklist response link
  (`/checklist-response/[token]`) — it's meant for external recipients who
  don't have the app password, and stays protected by its own unguessable
  token instead.

This is intentionally simple: one shared password, no user accounts, no
roles. It's meant to keep an internal demo from being wide open on a public
URL — not a substitute for real authentication if you need per-user access
control, put the app behind your own SSO/VPN instead.

## Optional: sending email

The Reporting Checklist works with **zero configuration** — recipients get
a Copy Link button and a mailto: link, no SMTP required. If you'd rather the
app send the email itself, set `SMTP_HOST` (and friends) in `.env` — see
`.env.example` for the full list. Without it, sends are skipped silently
and the manual options are always shown instead; nothing ever fails loudly.

## Deployment

```bash
npm run build
npm run start
```

For a fixed production domain, set `NEXT_PUBLIC_APP_URL` in `.env` so links
sent by email resolve correctly regardless of proxy/load-balancer headers
(in dev, and on most standard deployments, this is auto-detected and you
don't need to set it — see the comment in `.env.example`).

Set `APP_PASSWORD` too if this is going somewhere reachable by anyone other
than your team — see [Simple password protection](#simple-password-protection).

### Vercel

Works out of the box — connect the repo, set the environment variables from
`.env.example` you actually need (typically none beyond the defaults for a
quick demo), and deploy. SQLite's `dev.db` file is fine for a demo, but
isn't persistent across deploys/serverless instances on Vercel; for
anything beyond a throwaway demo, point `DATABASE_URL` at a hosted Postgres
database instead (see [Changing the schema](#changing-the-schema) for how
to swap providers) and run `npx prisma migrate deploy` once against it.

### Railway

Add a persistent volume if staying on SQLite (mount it and point
`DATABASE_URL` at a path inside it), or provision Railway's Postgres addon
and swap the Prisma datasource provider as above. Set the same environment
variables from `.env.example`, then run `npm run build && npm run start`
(or `npx prisma migrate deploy` as a release step) as the start command.

## Windows desktop installer

For handing this to someone on Windows who just wants to run it — no
Node.js, no terminal, no Docker: `electron/` wraps the app as a desktop
app, and `electron-builder` packages it into a normal `Setup.exe` (Start
Menu shortcut, uninstaller, the works). The database lives in the
per-user AppData folder and is pre-seeded from `config/projects.ts` /
`config/approvers.ts` on first launch — nothing to configure.

**Easiest path — GitHub Actions:** push this repo to GitHub and either
wait for the push-to-`main` trigger or run **Actions → Build Windows
installer → Run workflow** by hand. It builds on a real `windows-latest`
runner (important — see below) and the finished `Setup.exe` shows up as
a downloadable build artifact.

**Building it yourself on an actual Windows machine:**

```bash
npm ci
npm run dist:win
```

The installer lands in `dist-electron/`.

Why it has to run natively on Windows (or Windows CI), not be
cross-built from Mac/Linux: `better-sqlite3` is a native addon, and the
copy loaded inside the packaged app has to be compiled specifically
against Electron's own Node ABI *for Windows*. `npm run dist:win`
handles this automatically (see `scripts/build-electron.mjs`) — it
builds the isolated rebuild in the OS temp directory, well outside the
project, specifically so it can never touch your own working
`node_modules`; it double-checks that with a checksum before finishing
and refuses to continue if anything unexpected changed.

To customize the desktop build: app name/id/icon are in the `build` key
of `package.json`; the window itself is `electron/main.js`.

## Tech stack

Next.js 16 (App Router, Server Functions, Proxy) · TypeScript · Tailwind CSS ·
shadcn/ui (Base UI) · Prisma 7 · SQLite · Lucide icons · Electron (desktop
build).
