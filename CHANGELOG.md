# Changelog

All notable changes to Project Control Tower. Versions follow
[Semantic Versioning](https://semver.org/).

## [1.0.1] — 2026-11-03

- **Open source** under the [MIT licence](LICENSE).
- **The Windows installer comes in a ZIP** until code signing is in place,
  with `HOW TO INSTALL.txt` inside: how to check the installer's SHA-256,
  unblock it so Windows doesn't stop it, and install it for your user only
  (no administrator rights).
- Every release lists SHA-256 checksums and attaches `SHA256SUMS.txt`.
- Code signing through SignPath Foundation is prepared and switches on once
  the project is approved — see the [code signing policy](CODE_SIGNING.md).
  No changes to the app itself.

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
- **Fully offline and private by design.** No internet connection is
  needed, from install onwards, and nothing is sent anywhere: the window
  can only talk to the app's own local server (which other computers can't
  reach), fonts and icons are bundled, and Electron's spellchecker — which
  would download dictionaries from Google — is off. Verified with all
  outbound network blocked: the full test suite passes with zero outside
  requests, DNS lookups or connections.
- Links you click open in your own browser or mail app; anything else
  (files, programs) is never opened.
- **Upgrades keep your data.** On startup the app applies any database
  update it hasn't seen yet, after saving a full backup next to the
  database (`data.db.before-….bak`). If an update ever fails, the error
  names that backup.
- Installs from 0.1.x keep using their existing data folder.

### Fixed

- Installers built on a developer's machine could include that machine's
  `.env` file, passwords and all. The build now strips it and refuses to
  package one.
- `npm run electron:start` couldn't find the app's server in development.

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

[1.0.1]: https://github.com/CosminBMemetea/project-control-tower/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/CosminBMemetea/project-control-tower/compare/v0.1.3...v1.0.0
