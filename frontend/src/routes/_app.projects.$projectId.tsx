import { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  PlusIcon,
  ArrowLeftIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { projectsApi, issuesApi } from '@/lib/api'
import type { Issue, Project, IssueStatus } from '@/types'
import { IssueRow } from '@/components/issues/IssueRow'
import { CreateIssueModal } from '@/components/issues/CreateIssueModal'
import { StatusIcon, STATUS_LABELS } from '@/components/issues/StatusIcon'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export const Route = createFileRoute('/_app/projects/$projectId')({
  component: ProjectDetailPage,
})

const STATUS_ORDER: IssueStatus[] = ['in_progress', 'open', 'closed']

function ProjectDetailPage() {
  const { projectId } = Route.useParams()
  const id = Number(projectId)

  const [project, setProject] = useState<Project | null>(null)
  const [allIssues, setAllIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<IssueStatus>>(new Set(['closed']))

  useEffect(() => {
    Promise.all([projectsApi.get(id), issuesApi.list({ limit: 200 })]).then(([p, issues]) => {
      setProject(p)
      setAllIssues(issues)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  // Client-side filter by project_id
  // TODO (backend): add ?project_id= filter to GET /issues for efficient server-side filtering
  const issues = allIssues.filter((i) => i.project_id === id)

  function handleCreated(issue: Issue) {
    setAllIssues((prev) => [issue, ...prev])
  }

  function toggleGroup(status: IssueStatus) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: issues.filter((i) => i.status === status),
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-muted-foreground">Project not found.</p>
        <Link to="/projects" className="text-sm text-primary hover:underline">
          Back to projects
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 border-b border-border/60">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeftIcon className="size-3" />
          Projects
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">{project.name}</h1>
            {project.description && (
              <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setCreateOpen(true)}>
              <PlusIcon className="size-3.5" />
              New Issue
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/projects">
                    <PencilIcon className="size-4" />
                    Edit project
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          {STATUS_ORDER.map((s) => {
            const count = issues.filter((i) => i.status === s).length
            return (
              <span key={s} className="flex items-center gap-1.5">
                <StatusIcon status={s} size={12} />
                {count} {STATUS_LABELS[s].toLowerCase()}
              </span>
            )
          })}
        </div>
      </div>

      {/* Issue list */}
      <div className="flex-1 overflow-y-auto">
        {issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-sm text-muted-foreground">No issues in this project yet</p>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <PlusIcon className="size-4 mr-1" />
              Add first issue
            </Button>
          </div>
        ) : (
          grouped.map(({ status, items }) => (
            <div key={status}>
              <button
                onClick={() => toggleGroup(status)}
                className="flex w-full items-center gap-2.5 px-8 py-2.5 hover:bg-secondary/20 transition-colors"
              >
                {collapsed.has(status) ? (
                  <ChevronRightIcon className="size-3.5 text-muted-foreground/60" />
                ) : (
                  <ChevronDownIcon className="size-3.5 text-muted-foreground/60" />
                )}
                <StatusIcon status={status} size={14} />
                <span className="text-sm font-medium text-foreground/80">
                  {STATUS_LABELS[status]}
                </span>
                <span className="text-xs text-muted-foreground/60 ml-1">{items.length}</span>
              </button>

              {!collapsed.has(status) && (
                <div>
                  {items.length === 0 ? (
                    <p className="px-8 py-2 text-xs text-muted-foreground/50">No issues</p>
                  ) : (
                    items.map((issue) => (
                      <IssueRow key={issue.id} issue={issue} />
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <CreateIssueModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        projects={[project]}
        defaultProjectId={project.id}
        onCreated={handleCreated}
      />
    </div>
  )
}
