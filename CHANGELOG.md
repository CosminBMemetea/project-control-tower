# Changelog

All notable changes to Project Control Tower. Versions follow
[Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-11-03

The first official release. Projects, approvers and question sets are now
managed entirely in the app — no config files or seed runs needed.

### New

- **Project lifecycle status** — every project carries a PMBOK-style status,
  set from the project header: 💡 Initiating · 🗺️ Planning · 🚀 Ongoing ·
  ⏸️ On Hold · 🏁 Closing · 🧊 Closed · 🛑 Cancelled. On Hold, Closed and
  Cancelled projects drop out of the Portfolio Overview, Approvals and
  Missing Items, and are listed dimmed at the end of the Projects page.
- **Create and delete projects in the app** — New Project on the Projects
  page (the short code is made from the name if left blank); Delete project
  in the project header, behind a confirmation.
- **Approvers managed in the app** — add, rename or remove approvers on the
  Approvals page. Renaming keeps their existing sign-offs.
- **Editable Checklist and Monitoring questions** — Edit questions on either
  tab: reword, add, remove or reorder one at a time, or replace the whole
  set by pasting a list or loading a `.txt` / `.csv` file. Removing a
  checklist question keeps the answers already given to it. The original
  questions are one click away under Load defaults.
- **New app icon** — in the browser tab, the sidebar, and the Windows app
  and installer.

### Improved

- A meeting now shows "Needs update" based on its own schedule (a monthly
  meeting gets a month plus a week) instead of a flat 14 days.
- Renaming a goal track in `config/goals.ts` now renames its project tab,
  the checklist email and the portfolio messages too.
- Average coverage badges are colored by the level reached instead of
  always grey.
- The project name in the header is a full-size heading again, long short
  codes are no longer cut off, and portfolio stat labels wrap instead of
  being truncated.
- Executive Approval titles no longer carry a "120%" prefix.

### Windows desktop app

- **A branded installer** — a welcome page, sidebar and header in the app's
  colours, the new icon throughout, and a clearer file name
  (`Project-Control-Tower-Setup-1.0.0.exe`). Windows now shows the
  publisher, version and description in the installer's properties and in
  Apps & features.
- **Upgrades keep your data.** On startup the app applies any database
  update it hasn't seen yet, after saving a full backup next to the
  database (`data.db.before-….bak`). If an update ever fails, the error
  names that backup.
- Installs from 0.1.x keep using their existing data folder.

### Heads-up when upgrading

- Fresh installs start empty: no sample projects and no placeholder
  approvers. Create your own from the Projects and Approvals pages.
- Web deployments: run `npx prisma migrate deploy` once — this release adds
  two database migrations (the approver list and retired checklist
  questions). Existing approvers and sign-offs carry over automatically.
- `npm run db:seed` now only fills empty tables, so it never overwrites
  questions, approvers or projects edited in the app.

## Earlier versions

0.1.0 – 0.1.3 were internal builds; see the
[tags](https://github.com/CosminBMemetea/project-control-tower/tags).

[1.0.0]: https://github.com/CosminBMemetea/project-control-tower/compare/v0.1.3...v1.0.0
