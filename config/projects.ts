export interface ProjectConfig {
  name: string;
  code: string;
  gitRepoUrl?: string;
}

// Optional starting roster, created by `prisma/seed.ts` — handy for
// loading many projects at once. Day to day, use New Project on the
// Projects page instead.
//
// Existing rows are matched by `code` and never updated or deleted by
// the seed script, so renaming/removing an entry here won't touch a
// project that's already in the database; delete it from the project's
// own page if you no longer want it.
export const PROJECTS: ProjectConfig[] = [
  // { name: "Data Platform", code: "DATA", gitRepoUrl: "https://github.com/your-org/data-platform" },
];
