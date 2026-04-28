import { useState, useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { PlusIcon, FilterIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import { toast } from 'sonner'
import { issuesApi, projectsApi } from '@/lib/api'
import type { Issue, Project, IssueStatus } from '@/types'
import { IssueRow } from '@/components/issues/IssueRow'
import { CreateIssueModal } from '@/components/issues/CreateIssueModal'
import { StatusIcon, STATUS_LABELS } from '@/components/issues/StatusIcon'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export const Route = createFileRoute('/_app/issues')({
  component: IssuesPage,
})

const STATUS_ORDER: IssueStatus[] = ['in_progress', 'open', 'closed']

function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<IssueStatus>>(new Set(['closed']))

  useEffect(() => {
    Promise.all([issuesApi.list({ limit: 100 }), projectsApi.list({ limit: 100 })]).then(
      ([i, p]) => {
        setIssues(i)
        setProjects(p)
        setLoading(false)
      },
    )
  }, [])

  function handleCreated(issue: Issue) {
    setIssues((prev) => [issue, ...prev])
  }

  function toggleGroup(status: IssueStatus) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }

  const grouped = useMemo(() => {
    return STATUS_ORDER.map((status) => ({
      status,
      items: issues.filter((i) => i.status === status),
    }))
  }, [issues])

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-border/60">
        <h1 className="text-sm font-semibold text-foreground">All Issues</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground">
            <FilterIcon className="size-3.5" />
            Filter
          </Button>
          <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-3.5" />
            New Issue
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Spinner />
          </div>
        ) : issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-muted-foreground text-sm">No issues yet</p>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <PlusIcon className="size-4 mr-1" />
              Create your first issue
            </Button>
          </div>
        ) : (
          grouped.map(({ status, items }) => (
            <div key={status}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(status)}
                className="flex w-full items-center gap-2.5 px-8 py-2.5 hover:bg-secondary/20 transition-colors group"
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

              {/* Issue rows */}
              {!collapsed.has(status) && (
                <div>
                  {items.length === 0 ? (
                    <p className="px-8 py-2 text-xs text-muted-foreground/50">No issues</p>
                  ) : (
                    items.map((issue) => (
                      <IssueRow key={issue.id} issue={issue} projects={projects} />
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
        projects={projects}
        onCreated={handleCreated}
      />
    </div>
  )
}
