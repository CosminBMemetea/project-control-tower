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
  ENVIRONMENT_SETUP: "Environment Setup & Rules for R&I",
  PLANNING_TRACKING: "Planning & Tracking",
  MEETING_CADENCE: "Meeting Map & Cadence",
  REPORTING_CHECKLIST: "Reporting Checklist",
  PERIODIC_REPORTING: "Periodic Reporting",
  EXECUTION_ASSURANCE: "Execution Assurance (RUN)",
};

export const GOAL_SHORT_LABELS: Record<GoalType, string> = {
  ENVIRONMENT_SETUP: "Environment & Rules",
  PLANNING_TRACKING: "Planning & Tracking",
  MEETING_CADENCE: "Meetings & Cadence",
  REPORTING_CHECKLIST: "Checklist",
  PERIODIC_REPORTING: "Reporting",
  EXECUTION_ASSURANCE: "Execution / Compliance",
};

export const GOAL_LEVELS = [0, 25, 50, 75, 100, 120] as const;
export type GoalLevel = (typeof GOAL_LEVELS)[number];

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

export const REPORT_TYPES = ["MID_MONTH", "END_MONTH", "WEEKLY", "CUSTOM"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  MID_MONTH: "Mid-Month",
  END_MONTH: "End-Month",
  WEEKLY: "Weekly Status",
  CUSTOM: "Custom",
};

export const GOAL_LEVEL_COLORS: Record<number, string> = {
  0: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  25: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  50: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  75: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  100: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  120: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
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

export const STRUCTURE_HIERARCHY_ITEMS = [
  { field: "epicsPlanned", label: "Epics per year planned" },
  { field: "userStoriesPlanned", label: "User Stories per quarter planned" },
  { field: "tasksPlanned", label: "Tasks per sprint planned" },
  {
    field: "sprintsDefined",
    label: "4 Sprints per quarter defined, each with a Sprint Goal",
  },
] as const;

// Reporting Checklist — sent by email to a person, answered via a
// tokenized link, tracked per Project + recipient email + date.
export const CHECKLIST_QUESTIONS = [
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
export const MONITORING_QUESTIONS = [
  "Is the project's Git repository up to date and accessible to all team members?",
  "Is the CodeBeamer feature/project link current and reflecting the latest scope?",
  "Has the Way of Working been reviewed by the team in the last quarter?",
  "Is the environment setup documentation still accurate for new joiners?",
  "Has onboarding been completed for all new team members this period?",
  "Is the current quarter's planning presentation published and linked?",
  "Are all recurring meetings (weekly, sprint review, retro) active and attended?",
  "Have all sprint goals for the current quarter been logged?",
  "Are there any open deviations from the Business Innovation Process?",
  "Has the mid/end-month report been generated for this period?",
] as const;
