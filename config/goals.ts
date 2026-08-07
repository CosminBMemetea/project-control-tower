// Central place to rename the 6 goal tracks (and the "Executive Approval"
// / stretch tier) shown throughout the app — Portfolio Overview, each
// project's tabs, the Approvals page, etc. Edit the label strings freely
// to match your organization's own process names.
//
// Do NOT rename the keys in GOAL_TYPES (ENVIRONMENT_SETUP, ...) once you
// have real data — they're the stable identifiers stored in the database.
// Renaming a key here would orphan existing GoalProgress rows; only the
// LABEL text is meant to be customized.

export const GOAL_TYPES = [
  "ENVIRONMENT_SETUP",
  "PLANNING_TRACKING",
  "MEETING_CADENCE",
  "REPORTING_CHECKLIST",
  "PERIODIC_REPORTING",
  "EXECUTION_ASSURANCE",
] as const;

export type GoalType = (typeof GOAL_TYPES)[number];

export const GOAL_LABELS: Record<GoalType, string> = {
  ENVIRONMENT_SETUP: "Environment Setup & Rules",
  PLANNING_TRACKING: "Planning & Tracking",
  MEETING_CADENCE: "Meeting Cadence",
  REPORTING_CHECKLIST: "Reporting Checklist",
  PERIODIC_REPORTING: "Periodic Reporting",
  EXECUTION_ASSURANCE: "Execution Assurance",
};

export const GOAL_SHORT_LABELS: Record<GoalType, string> = {
  ENVIRONMENT_SETUP: "Environment & Rules",
  PLANNING_TRACKING: "Planning & Tracking",
  MEETING_CADENCE: "Meetings & Cadence",
  REPORTING_CHECKLIST: "Checklist",
  PERIODIC_REPORTING: "Reporting",
  EXECUTION_ASSURANCE: "Execution",
};

// The optional "stretch" tier above 100% completion — an extra sign-off
// step for projects with extended scope or investment. Purely cosmetic:
// rename or reword freely. The numeric level (120) it's tied to in
// GOAL_LEVELS (src/lib/constants.ts) is what's actually stored on each
// GoalProgress row, so changing the label here never affects existing data.
export const EXECUTIVE_APPROVAL_LEVEL = 120;
export const EXECUTIVE_APPROVAL_LABEL = "Executive Approval";
export const EXECUTIVE_APPROVAL_DESCRIPTION =
  "Full alignment and executive sign-off for extended scope";
