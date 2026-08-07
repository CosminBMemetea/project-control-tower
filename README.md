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

## Quick start (local development)

Requires Node.js 20+.

```bash
npm install                # also runs `prisma generate` automatically
cp .env.example .env       # DATABASE_URL is the only thing you truly need
npm run db:setup           # runs migrations, then seeds sample data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app uses SQLite by default (`dev.db`, created automatically) — there's
nothing else to install or provision to try it out.

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
NEXT_PUBLIC_APP_NAME="Acme Program Office"
NEXT_PUBLIC_APP_DESCRIPTION="Acme's project governance hub"
NEXT_PUBLIC_APP_PRIMARY_COLOR="#7c3aed"
NEXT_PUBLIC_APP_LOGO_URL="/logo.svg"
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

After editing either file, run `npm run db:seed` to apply the changes.

## Database

SQLite via Prisma, with a custom `better-sqlite3` driver adapter. The
schema lives in `prisma/schema.prisma`. To change it:

```bash
# edit prisma/schema.prisma, then:
npx prisma migrate dev --name describe_your_change
```

For a production deploy, use `npx prisma migrate deploy` instead (applies
existing migrations non-interactively; doesn't create new ones).

Swapping to Postgres/MySQL later just means changing `datasource.provider`
in `schema.prisma`, updating `DATABASE_URL`, and swapping the driver
adapter in `src/lib/prisma.ts`.

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

For a fixed production domain, set `APP_BASE_URL` in `.env` so links sent
by email resolve correctly regardless of proxy/load-balancer headers (in
dev, and on most standard deployments, this is auto-detected and you don't
need to set it — see the comment in `.env.example`).

There's no built-in authentication — every route is reachable by anyone who
can reach the server, and the Reporting Checklist response link
(`/checklist-response/[token]`) is intentionally public (token-secured, no
login) so external recipients can respond without an account. Put this
behind your own network/VPN/SSO boundary if that matters for your
deployment.

## Tech stack

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS ·
shadcn/ui (Base UI) · Prisma 7 · SQLite · Lucide icons.
