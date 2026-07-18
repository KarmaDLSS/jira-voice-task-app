export interface JiraProject {
  avatarUrls: AvatarUrls;
  id: string;
  insight: ProjectInsight;
  key: string;
  name: string;
  projectCategory: ProjectCategory;
  self: string;
  simplified: boolean;
  style: string; // e.g. "CLASSIC" | "NEXT_GEN"
}

export interface AvatarUrls {
  "16x16": string;
  "24x24": string;
  "32x32": string;
  "48x48": string;
}

export interface ProjectInsight {
  lastIssueUpdateTime: number;
  totalIssueCount: number;
}

export interface ProjectCategory {
  description: string;
  id: string;
  name: string;
  self: string;
}
