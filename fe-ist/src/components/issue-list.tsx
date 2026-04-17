import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Issue, IssueStatus, IssuePriority } from "@/lib/types"
import { IssueForm } from "./issue-form"
import { ConfirmDialog } from "./confirm-dialog"

const priorityConfig: Record<
  IssuePriority,
  { label: string; variant: "low" | "medium" | "high" }
> = {
  low: { label: "Low", variant: "low" },
  medium: { label: "Medium", variant: "medium" },
  high: { label: "High", variant: "high" },
}

const statusConfig: Record<
  IssueStatus,
  { label: string; variant: "open" | "in_progress" | "closed" }
> = {
  open: { label: "Open", variant: "open" },
  in_progress: { label: "In Progress", variant: "in_progress" },
  closed: { label: "Closed", variant: "closed" },
}

export function IssueList() {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "">("")
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | "">("")

  const filters = {
    ...(statusFilter && { status: statusFilter }),
    ...(priorityFilter && { priority: priorityFilter }),
  }

  const {
    data: issues = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["issues", filters],
    queryFn: () => api.getIssues(filters),
  })

  console.log("issues", issues)

  const deleteMutation = useMutation({
    mutationFn: api.deleteIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] })
      setDeletingId(null)
    },
  })

  const handleEdit = (issue: Issue) => {
    setEditingIssue(issue)
    setIsFormOpen(true)
  }

  const handleDelete = (id: number) => {
    setDeletingId(id)
  }

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId)
    }
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingIssue(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading issues...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-destructive">Failed to load issues</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Issues</h2>
        <Button onClick={() => setIsFormOpen(true)}>New Issue</Button>
      </div>

      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as IssueStatus | "")}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) =>
            setPriorityFilter(e.target.value as IssuePriority | "")
          }
          className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        {(statusFilter || priorityFilter) && (
          <Button
            variant="ghost"
            size="sm-text"
            onClick={() => {
              setStatusFilter("")
              setPriorityFilter("")
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {issues.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
          <div className="text-center text-muted-foreground">
            <p>No issues yet</p>
            <p className="text-sm">Create your first issue to get started</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="flex items-start justify-between rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{issue.title}</h3>
                  <Badge variant={priorityConfig[issue.priority].variant}>
                    {priorityConfig[issue.priority].label}
                  </Badge>
                  <Badge variant={statusConfig[issue.status].variant}>
                    {statusConfig[issue.status].label}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {issue.description}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm-text"
                  onClick={() => handleEdit(issue)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm-text"
                  onClick={() => handleDelete(issue.id)}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <IssueForm issue={editingIssue} onClose={handleCloseForm} />
      )}

      {deletingId && (
        <ConfirmDialog
          title="Delete Issue"
          description="Are you sure you want to delete this issue? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  )
}
