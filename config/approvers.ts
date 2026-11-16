// Optional starting roster of approvers for the Leadership Endorsement tier
// (see config/goals.ts). `prisma/seed.ts` loads it only into a database
// with no approvers yet — after that, add, rename, or remove approvers on
// the Sign-offs page. Every project gets one sign-off row per approver.
//
// e.g. ["Jane Doe", "John Smith"]
export const APPROVERS: string[] = [];
