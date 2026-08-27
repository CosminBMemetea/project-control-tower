export interface ProjectConfig {
  name: string;
  code: string;
  gitRepoUrl?: string;
}

// Add or remove entries here to control which projects get created by
// `prisma/seed.ts`. This is the single source of truth for the project
// roster — do not hardcode project names/codes anywhere else.
//
// The list below is placeholder sample data — replace it with your own
// projects before deploying. Existing rows are matched by `code` and never
// deleted by the seed script, so renaming/removing an entry here won't
// touch a project that's already in the database; delete it by hand
// (or via the app) if you no longer want it.
export const PROJECTS: ProjectConfig[] = [
  {
    name: "Project Alpha",
    code: "ALPHA",
    gitRepoUrl: "https://github.com/example-org/project-alpha",
  },
  {
    name: "Project Beta",
    code: "BETA",
    gitRepoUrl: "https://github.com/example-org/project-beta",
  },
  {
    name: "Project Gamma",
    code: "GAMMA",
    gitRepoUrl: "https://github.com/example-org/project-gamma",
  },
  {
    name: "Project Delta",
    code: "DELTA",
    gitRepoUrl: "https://github.com/example-org/project-delta",
  },
  {
    name: "Project Epsilon",
    code: "EPSILON",
    gitRepoUrl: "https://github.com/example-org/project-epsilon",
  },
];
