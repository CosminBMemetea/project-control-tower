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
  WEEKLY: "Weekly Update",
  SPRINT_REVIEW: "Sprint Review",
  RETRO: "Retrospective",
  OTHER: "Other",
};

export const GOAL_LEVEL_COLORS: Record<number, string> = {
  0: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  25: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  50: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  75: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  100: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  120: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
};

export const CHECKLIST_QUESTIONS = [
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
