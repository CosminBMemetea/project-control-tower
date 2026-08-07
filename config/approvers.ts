// The approvers required to sign off on the Executive Approval tier (see
// config/goals.ts) for every project. Do not hardcode approver names
// anywhere else — every project gets one ManagerApproval row per entry
// here (see `prisma/seed.ts`). Add, remove, or rename entries freely.
export const APPROVERS: string[] = ["Manager One", "Manager Two", "Manager Three"];
