# Changelog

All notable changes to Project Control Tower. Versions follow
[Semantic Versioning](https://semver.org/).

## [1.1.0] — 2026-11-16

A fresh start for the public repository: one clean history, new names for
the reporting views, and a demo portfolio for walkthroughs.

### New names for the reporting views

- **Weekly Pulse**, **Mid-Month Checkpoint**, **Month-End Review** and
  **Ad-hoc** are the report types.
- Every report is built from the **Report Blueprint**, which starts with
  **Wins**, **Roadblocks**, **Takeaways**, **Team Asks**, **Shipped This
  Sprint** and **Next Sprint Focus**. All sections stay editable.
- The Portfolio Overview shows the **Portfolio Pulse**, the latest **Wins &
  Roadblocks**, a **Risk Watchlist Summary** and **Open Gaps**, and links to
  the **Month-End Digest**.
- Goal tracks: **Status Check-ins** and **Delivery Updates**; the stretch
  tier is **Leadership Endorsement**, signed on the **Sign-offs** page.
- Each project has a **Risk Watchlist** tab and a **Report Archive**.

### Demo portfolio

- `npm run db:seed-demo` fills a database with a sample portfolio (RAG
  status, health scores, risks, reports and sign-offs) for screenshots and
  walkthroughs. It is opt-in: `npm run db:seed` and the Windows installer
  still start empty.
- A short walkthrough GIF lives in `docs/media/pct-demo.gif`.

### Heads-up when upgrading

- Report sections are stored in your database, so an existing install keeps
  the section names it already has. Rename them on the Report Blueprint
  page; the Portfolio Overview reads the **Wins** and **Roadblocks**
  sections by name.
- No database migration in this release.

## Earlier versions

Before 1.1.0 the app shipped as 0.1.x internal builds and the 1.0.x
releases: the Windows desktop app (offline, per-user install, data kept on
upgrade, automatic database backups before updates), in-app management of
projects, approvers and question sets, project lifecycle status, the
Project Health radar and the Meeting Map. That history was consolidated
into this release.

[1.1.0]: https://github.com/CosminBMemetea/project-control-tower/releases/tag/v1.1.0
