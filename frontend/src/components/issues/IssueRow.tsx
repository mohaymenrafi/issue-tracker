import { useNavigate } from '@tanstack/react-router'
import type { Issue, Project } from '@/types'
import { StatusIcon } from './StatusIcon'
import { PriorityIcon } from './PriorityIcon'
import { cn } from '@/lib/utils'

interface IssueRowProps {
  issue: Issue
  projects?: Project[]
  onStatusChange?: (id: number, status: Issue['status']) => void
  className?: string
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d`
  return `${Math.floor(d / 30)}mo`
}

export function IssueRow({ issue, projects, className }: IssueRowProps) {
  const navigate = useNavigate()
  const project = projects?.find((p) => p.id === issue.project_id)

  return (
    <div
      onClick={() => navigate({ to: '/issue/$issueId', params: { issueId: String(issue.id) } })}
      className={cn(
        'group flex items-center gap-3 px-4 py-2.5 border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer',
        className,
      )}
    >
      {/* Status */}
      <StatusIcon status={issue.status} size={15} className="shrink-0 opacity-80 group-hover:opacity-100" />

      {/* ID */}
      <span className="shrink-0 text-[11px] font-mono text-muted-foreground/60 w-14 select-none">
        ISS-{issue.id}
      </span>

      {/* Title */}
      <span className="flex-1 truncate text-sm text-foreground/90 group-hover:text-foreground">
        {issue.title}
      </span>

      {/* Project badge */}
      {project && (
        <span className="shrink-0 hidden sm:inline-flex items-center rounded px-1.5 py-0.5 text-[11px] text-muted-foreground/70 bg-muted/50 border border-border/50">
          {project.name}
        </span>
      )}

      {/* Priority */}
      <PriorityIcon priority={issue.priority} size={13} className="shrink-0 opacity-60 group-hover:opacity-100" />

      {/* Date */}
      <span className="shrink-0 text-[11px] text-muted-foreground/60 w-8 text-right select-none">
        {relativeTime(issue.updated_at)}
      </span>
    </div>
  )
}
