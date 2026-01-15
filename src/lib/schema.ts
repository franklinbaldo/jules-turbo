import { z } from "zod";

export const BranchSchema = z.object({
  name: z.string(),
  displayName: z.string().optional(),
}).passthrough();

export const GithubRepoSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  webUrl: z.string().optional(),
  defaultBranch: z.string().optional(),
  branches: z.array(BranchSchema).optional(),
}).passthrough();

export const SourceSchema = z.object({
  name: z.string(),
  githubRepo: GithubRepoSchema.optional(),
}).passthrough();

export const ListSourcesResponseSchema = z.object({
  sources: z.array(SourceSchema).optional(),
  nextPageToken: z.string().optional(),
});

export const SessionStateSchema = z.enum([
  "STATE_UNSPECIFIED",
  "QUEUED",
  "PLANNING",
  "AWAITING_PLAN_APPROVAL",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
  "CANCELLED"
]);

export const SessionSchema = z.object({
  name: z.string(),
  createTime: z.string(),
  updateTime: z.string().optional(),
  state: SessionStateSchema.optional().default("STATE_UNSPECIFIED"),
  prompt: z.string().optional(),
  url: z.string().optional(),
  requirePlanApproval: z.boolean().optional(),
}).passthrough();

export const ListSessionsResponseSchema = z.object({
  sessions: z.array(SessionSchema).optional(),
  nextPageToken: z.string().optional(),
});

export const ActivitySchema = z.object({
  name: z.string(),
  createTime: z.string(),
  type: z.string().optional(),
}).passthrough();

export const ListActivitiesResponseSchema = z.object({
  activities: z.array(ActivitySchema).optional(),
  nextPageToken: z.string().optional(),
});

export type Source = z.infer<typeof SourceSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type SessionState = z.infer<typeof SessionStateSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
