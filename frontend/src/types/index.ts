export type IssueStatus = 'open' | 'in_progress' | 'closed'
export type IssuePriority = 'low' | 'medium' | 'high'

export interface User {
  id: number
  email: string
  username: string
  name: string | null
  created_at: string
}

export interface Issue {
  id: number
  title: string
  description: string
  priority: IssuePriority
  status: IssueStatus
  reporter_id: number | null
  assignee_id: number | null
  project_id: number | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: number
  name: string
  description: string | null
  owner_id: number
  created_at: string
}

export interface IssueCreate {
  title: string
  description: string
  priority?: IssuePriority
  status?: IssueStatus
  project_id?: number | null
  assignee_id?: number | null
}

export interface IssueUpdate {
  title?: string
  description?: string
  priority?: IssuePriority
  status?: IssueStatus
}

export interface ProjectCreate {
  name: string
  description?: string | null
}

export interface ProjectUpdate {
  name?: string
  description?: string | null
}

export interface TokenResponse {
  access_token: string
  token_type: string
}
