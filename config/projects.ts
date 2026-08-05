export interface ProjectConfig {
  name: string;
  code: string;
  gitRepoUrl?: string;
}

// Add or remove entries here to control which projects get created by
// `prisma/seed.ts`. This is the single source of truth for the project
// roster — do not hardcode project names/codes anywhere else.
export const PROJECTS: ProjectConfig[] = [
  {
    name: "ATHENA",
    code: "ATHENA",
    gitRepoUrl: "https://dev.azure.com/magna-ri/athena/_git/athena",
  },
  {
    name: "Drive Assist LLM",
    code: "DA-LLM",
    gitRepoUrl: "https://dev.azure.com/magna-ri/drive-assist-llm/_git/drive-assist-llm",
  },
  {
    name: "Voxel Grid",
    code: "VOXEL",
    gitRepoUrl: "https://dev.azure.com/magna-ri/voxel-grid/_git/voxel-grid",
  },
  {
    name: "Radar Camera Fusion Parking",
    code: "RCF-PARK",
    gitRepoUrl: "https://dev.azure.com/magna-ri/rcf-parking/_git/rcf-parking",
  },
  {
    name: "Live Range Assessor",
    code: "LRA",
    gitRepoUrl: "https://dev.azure.com/magna-ri/live-range-assessor/_git/live-range-assessor",
  },
  {
    name: "USS Replacement",
    code: "USS-REPL",
    gitRepoUrl: "https://dev.azure.com/magna-ri/uss-replacement/_git/uss-replacement",
  },
  {
    name: "Gating Imaging",
    code: "GATING-IMG",
    gitRepoUrl: "https://dev.azure.com/magna-ri/gating-imaging/_git/gating-imaging",
  },
];
