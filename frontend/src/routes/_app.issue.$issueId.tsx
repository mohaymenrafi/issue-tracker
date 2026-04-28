import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { issuesApi } from '@/lib/api'
import type { Issue, IssueStatus, IssuePriority } from '@/types'
import { StatusIcon } from '@/components/issues/StatusIcon'
import { PriorityIcon } from '@/components/issues/PriorityIcon'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

export const Route = createFileRoute('/_app/issue/$issueId')({
  component: IssueDetailPage,
})

const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'closed', label: 'Closed' },
]

const PRIORITY_OPTIONS: { value: IssuePriority; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

function IssueDetailPage() {
  const { issueId } = Route.useParams()
  const navigate = useNavigate()
  const [issue, setIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    issuesApi
      .get(Number(issueId))
      .then((data) => {
        setIssue(data)
        setTitle(data.title)
        setDescription(data.description ?? '')
      })
      .catch(() => toast.error('Failed to load issue'))
      .finally(() => setLoading(false))
  }, [issueId])

  async function handleStatusChange(status: IssueStatus) {
    if (!issue) return
    setSaving(true)
    try {
      const updated = await issuesApi.update(issue.id, { status })
      setIssue(updated)
      toast.success('Status updated')
    } catch {
      toast.error('Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  async function handlePriorityChange(priority: IssuePriority) {
    if (!issue) return
    setSaving(true)
    try {
      const updated = await issuesApi.update(issue.id, { priority })
      setIssue(updated)
      toast.success('Priority updated')
    } catch {
      toast.error('Failed to update priority')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveTitle() {
    if (!issue || title === issue.title) return
    setSaving(true)
    try {
      const updated = await issuesApi.update(issue.id, { title })
      setIssue(updated)
      toast.success('Title saved')
    } catch {
      toast.error('Failed to save title')
      setTitle(issue.title)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveDescription() {
    if (!issue || description === (issue.description ?? '')) return
    setSaving(true)
    try {
      const updated = await issuesApi.update(issue.id, { description })
      setIssue(updated)
    } catch {
      toast.error('Failed to save description')
      setDescription(issue.description ?? '')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!issue) return
    setDeleting(true)
    try {
      await issuesApi.delete(issue.id)
      toast.success('Issue deleted')
      navigate({ to: '/issues' })
    } catch {
      toast.error('Failed to delete issue')
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        Loading…
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        Issue not found.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto px-6 py-6 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground/60">ISS-{issue.id}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 px-2"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
          >
            <Trash2Icon className="size-3.5" />
            <span className="ml-1.5 text-xs">Delete</span>
          </Button>
        </div>
      </div>

      {/* Title */}
      <input
        className="w-full bg-transparent text-xl font-semibold text-foreground placeholder:text-muted-foreground/40 focus:outline-none border-none"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleSaveTitle}
        placeholder="Issue title"
        disabled={saving}
      />

      {/* Properties row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Status */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
              <StatusIcon status={issue.status} size={12} />
              <span className="capitalize">{issue.status.replace('_', ' ')}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {STATUS_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onSelect={() => handleStatusChange(opt.value)}
                className="flex items-center gap-2"
              >
                <StatusIcon status={opt.value} size={12} />
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Priority */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
              <PriorityIcon priority={issue.priority} size={12} />
              <span className="capitalize">{issue.priority}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {PRIORITY_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onSelect={() => handlePriorityChange(opt.value)}
                className="flex items-center gap-2"
              >
                <PriorityIcon priority={opt.value} size={12} />
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Divider */}
      <div className="h-px bg-border/50" />

      {/* Description */}
      <div className="flex-1">
        <textarea
          className="w-full min-h-[200px] bg-transparent text-sm text-foreground/80 placeholder:text-muted-foreground/40 focus:outline-none resize-none border-none leading-relaxed"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleSaveDescription}
          placeholder="Add a description…"
          disabled={saving}
        />
      </div>

      {/* Meta footer */}
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground/50 border-t border-border/30 pt-4">
        <span>Created {new Date(issue.created_at).toLocaleDateString()}</span>
        <span>Updated {new Date(issue.updated_at).toLocaleDateString()}</span>
      </div>

      {/* Delete confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm" showClose={false}>
          <DialogHeader>
            <DialogTitle>Delete issue?</DialogTitle>
          </DialogHeader>
          <p className="px-6 pb-2 text-sm text-muted-foreground">
            <span className="font-mono text-xs text-muted-foreground/60">ISS-{issue.id}</span>{' '}
            <span className="font-medium text-foreground/80">{issue.title}</span> will be
            permanently deleted. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete issue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
