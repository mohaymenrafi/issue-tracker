import type {
  Issue,
  IssueCreate,
  IssueUpdate,
  IssuePriority,
  IssueStatus,
} from "./types"

const API_BASE = "http://localhost:8000/api/v1/issues"

export const api = {
  async getIssues(filters?: {
    status?: IssueStatus
    priority?: IssuePriority
  }): Promise<Issue[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.set("status", filters.status)
    if (filters?.priority) params.set("priority", filters.priority)
    const query = params.toString()
    const res = await fetch(query ? `${API_BASE}?${query}` : API_BASE)
    if (!res.ok) throw new Error("Failed to fetch issues")
    return res.json()
  },

  async getIssue(id: number): Promise<Issue> {
    const res = await fetch(`${API_BASE}/${id}`)
    if (!res.ok) throw new Error("Failed to fetch issue")
    return res.json()
  },

  async createIssue(data: IssueCreate): Promise<Issue> {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to create issue")
    return res.json()
  },

  async updateIssue(id: number, data: IssueUpdate): Promise<Issue> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to update issue")
    return res.json()
  },

  async deleteIssue(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to delete issue")
  },
}
