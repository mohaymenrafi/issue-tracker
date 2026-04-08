export type IssueStatus = "open" | "closed" | "in_progress";

export type IssuePriority = "low" | "medium" | "high";

export interface Issue {
  id: string;
  title: string;
  description: string;
  priority: IssuePriority;
  status: IssueStatus;
}

export interface IssueUpdate {
  title?: string;
  description?: string;
  priority?: IssuePriority;
  status?: IssueStatus;
}

export type IssueCreate = Omit<Issue, "id" | "status">;
export type IssueUpdateForm = Partial<Omit<Issue, "id">>;
