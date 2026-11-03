// The 6 goal tracks and their display labels live in config/goals.ts —
// that's the file to edit to rename them for your organization. Re-export
// here so every existing `@/lib/constants` import keeps working.
import {
  GOAL_TYPES,
  GOAL_LABELS,
  GOAL_SHORT_LABELS,
  EXECUTIVE_APPROVAL_LEVEL,
  EXECUTIVE_APPROVAL_LABEL,
  EXECUTIVE_APPROVAL_DESCRIPTION,
} from "@config/goals";
export {
  GOAL_TYPES,
  GOAL_LABELS,
  GOAL_SHORT_LABELS,
  EXECUTIVE_APPROVAL_LEVEL,
  EXECUTIVE_APPROVAL_LABEL,
  EXECUTIVE_APPROVAL_DESCRIPTION,
};
export type { GoalType } from "@config/goals";

// The top level is the Executive Approval stretch tier — tied to
// config/goals.ts rather than repeated here, so changing it there can't
// leave the level picker and the Approvals page disagreeing.
export const GOAL_LEVELS = [0, 25, 50, 75, 100, EXECUTIVE_APPROVAL_LEVEL] as const;
export type GoalLevel = (typeof GOAL_LEVELS)[number];

// Project lifecycle status — where a project sits in its PMBOK lifecycle,
// independent of RAG (how healthy it is right now). ACTIVE keeps its
// original key (it was the only value before this list existed), so
// existing rows need no data migration; only its label is "Ongoing".
export const PROJECT_STATUSES = [
  "INITIATING",
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "CLOSING",
  "CLOSED",
  "CANCELLED",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  INITIATING: "Initiating",
  PLANNING: "Planning",
  ACTIVE: "Ongoing",
  ON_HOLD: "On Hold",
  CLOSING: "Closing",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

export const PROJECT_STATUS_EMOJI: Record<ProjectStatus, string> = {
  INITIATING: "💡",
  PLANNING: "🗺️",
  ACTIVE: "🚀",
  ON_HOLD: "⏸️",
  CLOSING: "🏁",
  CLOSED: "🧊",
  CANCELLED: "🛑",
};

export const PROJECT_STATUS_DESCRIPTIONS: Record<ProjectStatus, string> = {
  INITIATING: "Charter and key stakeholders being defined",
  PLANNING: "Scope, schedule and budget being baselined",
  ACTIVE: "Executing — work under way against the plan",
  ON_HOLD: "Paused by decision, expected to resume",
  CLOSING: "Handover, final report and lessons learned",
  CLOSED: "Formally closed — on the shelf",
  CANCELLED: "Terminated before completion",
};

// Statuses still expected to follow the governance cadence (meetings,
// weekly reports, approvals). On Hold / Closed / Cancelled projects drop
// out of the Portfolio Overview, Approvals, and Missing Items so they
// don't nag about reports nobody should be writing.
export const TRACKED_PROJECT_STATUSES: ProjectStatus[] = [
  "INITIATING",
  "PLANNING",
  "ACTIVE",
  "CLOSING",
];

export function toProjectStatus(status: string): ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(status)
    ? (status as ProjectStatus)
    : "ACTIVE";
}

export function isTrackedProjectStatus(status: string): boolean {
  return TRACKED_PROJECT_STATUSES.includes(toProjectStatus(status));
}

export const MEETING_TYPES = [
  "WEEKLY",
  "SPRINT_REVIEW",
  "RETRO",
  "OTHER",
] as const;

export const MEETING_TYPE_LABELS: Record<(typeof MEETING_TYPES)[number], string> = {
  WEEKLY: "Weekly Sync",
  SPRINT_REVIEW: "Sprint Review",
  RETRO: "Retrospective",
  OTHER: "Other",
};

// The 3 recurring meetings every project is expected to have — always
// shown on the Meeting Map even when missing, and used to compute the
// "missing meeting map" signal on the Portfolio Overview.
export const CORE_MEETING_TYPES = ["WEEKLY", "SPRINT_REVIEW", "RETRO"] as const;

export const WEEKDAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export const WEEKDAY_LABELS: Record<(typeof WEEKDAYS)[number], string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

export const RECURRENCE_TYPES = [
  "WEEKLY",
  "BIWEEKLY",
  "EVERY_3_WEEKS",
  "MONTHLY",
  "CUSTOM",
] as const;

export const RECURRENCE_LABELS: Record<(typeof RECURRENCE_TYPES)[number], string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Every 2 weeks",
  EVERY_3_WEEKS: "Every 3 weeks",
  MONTHLY: "Monthly",
  CUSTOM: "Custom",
};

// Days between occurrences, for judging when a meeting has gone stale.
// CUSTOM is free text with no interval to read, so it's left out and
// falls back to weekly (see computeMeetingStatus).
export const RECURRENCE_INTERVAL_DAYS: Partial<
  Record<(typeof RECURRENCE_TYPES)[number], number>
> = {
  WEEKLY: 7,
  BIWEEKLY: 14,
  EVERY_3_WEEKS: 21,
  MONTHLY: 31,
};

// How late a meeting can be logged past its interval before it shows
// as "Needs update".
export const MEETING_GRACE_DAYS = 7;

export const REPORT_TYPES = ["MID_MONTH", "END_MONTH", "WEEKLY", "CUSTOM"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  MID_MONTH: "Mid-Month",
  END_MONTH: "End-Month",
  WEEKLY: "Weekly Status",
  CUSTOM: "Custom",
};

// Weekly Status reports are expected on these days — a WEEKLY report
// dated any other weekday is flagged "off-cadence".
export const WEEKLY_REPORT_DAYS: (typeof WEEKDAYS)[number][] = ["MONDAY", "THURSDAY"];

// The two report template sections the Portfolio Overview surfaces from
// each project's latest Weekly Status. Sections are user-editable, so
// these are matched by label (see findSectionContent) — renaming either
// section on the Report Template page empties that portfolio column.
export const HIGHLIGHTS_SECTION_LABEL = "Highlights";
export const LOWLIGHTS_SECTION_LABEL = "Lowlights";

// Seeded only into an empty database; edit live via the Report Template page.
export const DEFAULT_REPORT_TEMPLATE = [
  { label: HIGHLIGHTS_SECTION_LABEL, hasLinks: false },
  { label: LOWLIGHTS_SECTION_LABEL, hasLinks: false },
  { label: "Lessons Learned", hasLinks: false },
  { label: "Requests from the Team", hasLinks: false },
  { label: "Done This Sprint", hasLinks: true },
  { label: "Up Next Sprint", hasLinks: false },
];

export const GOAL_LEVEL_COLORS: Record<number, string> = {
  0: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  25: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  50: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  75: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  100: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  [EXECUTIVE_APPROVAL_LEVEL]: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
};

// Sanity ceiling for a single project's Allocated FTE — guards against a
// stray extra digit or scientific-notation entry (e.g. "1e10") producing
// an absurd value with no feedback. Not a real staffing constraint.
export const MAX_ALLOCATED_FTE = 500;

// RAG status — current delivery health for the project as a whole.
export const RAG_STATUSES = ["GREEN", "AMBER", "RED"] as const;
export type RagStatus = (typeof RAG_STATUSES)[number];

export const RAG_LABELS: Record<RagStatus, string> = {
  GREEN: "Green",
  AMBER: "Amber",
  RED: "Red",
};

export const RAG_COLORS: Record<RagStatus, string> = {
  GREEN: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  AMBER: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  RED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

// Risk Register — impact / probability / status vocabularies.
export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  LOW: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  HIGH: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export const RISK_STATUSES = ["OPEN", "MITIGATING", "CLOSED"] as const;
export type RiskStatus = (typeof RISK_STATUSES)[number];

export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  OPEN: "Open",
  MITIGATING: "Mitigating",
  CLOSED: "Closed",
};

// A risk both very likely and very damaging — surfaced as an explicit
// portfolio-level action item, distinct from just "open".
export function isHighSeverity(risk: { impact: string; probability: string }) {
  return risk.impact === "HIGH" && risk.probability === "HIGH";
}

// Project Health Spider Web — 6 dimensions, each scored 1-5.
export const HEALTH_DIMENSIONS = [
  "SCOPE",
  "SCHEDULE",
  "COST",
  "RISK",
  "QUALITY",
  "RESOURCES",
] as const;
export type HealthDimension = (typeof HEALTH_DIMENSIONS)[number];

export const HEALTH_DIMENSION_LABELS: Record<HealthDimension, string> = {
  SCOPE: "Scope",
  SCHEDULE: "Schedule",
  COST: "Cost",
  RISK: "Risk",
  QUALITY: "Quality",
  RESOURCES: "Resources",
};

export const HEALTH_SCORES = [1, 2, 3, 4, 5] as const;
export type HealthScore = (typeof HEALTH_SCORES)[number];
export const HEALTH_SCORE_MIN = 1;
export const HEALTH_SCORE_MAX = 5;
export const HEALTH_DEFAULT_SCORE: HealthScore = 3;

export const HEALTH_SCORE_LABELS: Record<HealthScore, string> = {
  1: "Critical",
  2: "Weak",
  3: "Adequate",
  4: "Good",
  5: "Excellent",
};

// A dimension at or below this is flagged as a weak spot, portfolio-wide.
export const HEALTH_WEAK_THRESHOLD = 2;

// A gap this wide between the strongest and weakest dimension flags the
// project as unbalanced, whatever its average.
export const HEALTH_UNBALANCED_SPREAD = 3;

// Three-tier read on an average score, reusing the same red/amber/green
// vocabulary as RAG status for a consistent "at a glance" language.
export type HealthTier = "GOOD" | "WATCH" | "CRITICAL";

export const HEALTH_TIER_COLORS: Record<HealthTier, string> = {
  GOOD: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  WATCH: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function healthTier(average: number): HealthTier {
  if (average >= 4) return "GOOD";
  if (average >= 2.5) return "WATCH";
  return "CRITICAL";
}

// Links & References (Environment & Rules tab) — single source of truth
// for both the field list rendered on the page and the whitelist the
// setProjectLink action trusts (via the field's TS type).
export const PROJECT_LINK_FIELDS = [
  { field: "gitRepoUrl", label: "Git Repository URL" },
  { field: "codebeamerUrl", label: "Requirements / Backlog Tool link" },
  { field: "wowPresentationUrl", label: "Way of Working presentation" },
  { field: "envSetupDocUrl", label: "Environment Setup documentation" },
  { field: "onboardingGuideUrl", label: "Onboarding Guide" },
] as const;

export const STRUCTURE_HIERARCHY_ITEMS = [
  { field: "epicsPlanned", label: "Epics per year planned" },
  { field: "userStoriesPlanned", label: "User Stories per quarter planned" },
  { field: "tasksPlanned", label: "Tasks per sprint planned" },
  {
    field: "sprintsDefined",
    label: "4 Sprints per quarter defined, each with a Sprint Goal",
  },
] as const;

// The two shared question sets, both edited live from any project's
// Checklist / Monitoring tab. The DEFAULT_* lists below are only a
// starting point: seeded into an empty database, and offered behind
// "Load defaults" in the editor.
export const QUESTION_SETS = ["checklist", "monitoring"] as const;
export type QuestionSet = (typeof QUESTION_SETS)[number];

// Sanity limits for a pasted / uploaded list — not a real constraint on
// how a checklist should look.
export const MAX_QUESTIONS = 50;
export const MAX_QUESTION_LENGTH = 500;

// Reporting Checklist — sent by email to a person, answered via a
// tokenized link, tracked per Project + recipient email + date.
export const DEFAULT_CHECKLIST_QUESTIONS = [
  "What is delivered today / this week?",
  "What is planned for the next sprint?",
  "What is planned for the next milestone / gate?",
  "When is the next release planned?",
  "What are the top 3 risks right now?",
  "Are we on schedule vs. the sprint plan?",
  "Are we on schedule vs. the gate/milestone plan?",
  "Are there blockers requiring management action?",
  "What dependencies exist (internal/external)?",
  "What decisions are pending and who owns them?",
] as const;

// Verification (a submitted Reporting Checklist response) is expected at
// least this often per project.
export const CHECKLIST_VERIFICATION_DAYS = 14;

// Monitoring — simple per-project checkboxes, never emailed.
export const DEFAULT_MONITORING_QUESTIONS = [
  "Is the project's Git repository up to date and accessible to all team members?",
  "Is the requirements/backlog tracker link current and reflecting the latest scope?",
  "Has the Way of Working been reviewed by the team in the last quarter?",
  "Is the environment setup documentation still accurate for new joiners?",
  "Has onboarding been completed for all new team members this period?",
  "Is the current quarter's planning presentation published and linked?",
  "Are all recurring meetings (weekly, sprint review, retro) active and attended?",
  "Have all sprint goals for the current quarter been logged?",
  `Are there any open deviations from the ${EXECUTIVE_APPROVAL_LABEL.toLowerCase()} process?`,
  "Has the mid/end-month report been generated for this period?",
] as const;
