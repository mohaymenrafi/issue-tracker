import { useState, useEffect, useRef, type KeyboardEvent } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { StatusIcon, STATUS_LABELS } from './StatusIcon'
import { PriorityIcon, PRIORITY_LABELS } from './PriorityIcon'
import { issuesApi } from '@/lib/api'
import type { Issue, Project, IssueStatus, IssuePriority } from '@/types'
import { XIcon, ChevronDownIcon, FolderIcon } from 'lucide-react'

interface CreateIssueModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects?: Project[]
  defaultProjectId?: number
  onCreated?: (issue: Issue) => void
}

const STATUS_OPTIONS: IssueStatus[] = ['open', 'in_progress', 'closed']
const PRIORITY_OPTIONS: IssuePriority[] = ['high', 'medium', 'low']

export function CreateIssueModal({
  open,
  onOpenChange,
  projects = [],
  defaultProjectId,
  onCreated,
}: CreateIssueModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<IssueStatus>('open')
  const [priority, setPriority] = useState<IssuePriority>('medium')
  const [projectId, setProjectId] = useState<number | null>(defaultProjectId ?? null)
  const [loading, setLoading] = useState(false)
  const titleRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setTitle('')
      setDescription('')
      setStatus('open')
      setPriority('medium')
      setProjectId(defaultProjectId ?? null)
      // Focus title on next tick after animation
      setTimeout(() => titleRef.current?.focus(), 50)
    }
  }, [open, defaultProjectId])

  // Auto-resize title textarea
  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  async function handleSubmit() {
    if (!title.trim() || loading) return
    setLoading(true)
    try {
      const issue = await issuesApi.create({
        title: title.trim(),
        description: description.trim() || title.trim(),
        status,
        priority,
        project_id: projectId,
      })
      toast.success('Issue created')
      onCreated?.(issue)
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create issue')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const selectedProject = projects.find((p) => p.id === projectId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="max-w-[600px] p-0 gap-0 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Team / project breadcrumb */}
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <span>My workspace</span>
            <span>›</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                  {selectedProject ? (
                    <>
                      <FolderIcon className="size-3" />
                      {selectedProject.name}
                    </>
                  ) : (
                    'No project'
                  )}
                  <ChevronDownIcon className="size-3 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setProjectId(null)}>
                  No project
                </DropdownMenuItem>
                {projects.map((p) => (
                  <DropdownMenuItem key={p.id} onClick={() => setProjectId(p.id)}>
                    <FolderIcon className="size-3.5" />
                    {p.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <DialogClose className="rounded p-0.5 text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors">
            <XIcon className="size-4" />
          </DialogClose>
        </div>

        {/* Title */}
        <div className="px-5 pt-3">
          <textarea
            ref={titleRef}
            rows={1}
            placeholder="Issue title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              autoResize(e.target)
            }}
            className="w-full resize-none overflow-hidden bg-transparent text-[17px] font-medium text-foreground placeholder:text-muted-foreground/40 outline-none border-none leading-snug"
          />
        </div>

        {/* Description */}
        <div className="px-5 pt-1 pb-4">
          <textarea
            rows={4}
            placeholder="Add description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-none bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/35 outline-none border-none leading-relaxed"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-border/50">
          {/* Status pill */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md border border-border/60 px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <StatusIcon status={status} size={13} />
                {STATUS_LABELS[status]}
                <ChevronDownIcon className="size-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {STATUS_OPTIONS.map((s) => (
                <DropdownMenuItem key={s} onClick={() => setStatus(s)}>
                  <StatusIcon status={s} size={14} />
                  {STATUS_LABELS[s]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority pill */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md border border-border/60 px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <PriorityIcon priority={priority} size={13} />
                {PRIORITY_LABELS[priority]}
                <ChevronDownIcon className="size-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {PRIORITY_OPTIONS.map((p) => (
                <DropdownMenuItem key={p} onClick={() => setPriority(p)}>
                  <PriorityIcon priority={p} size={14} />
                  {PRIORITY_LABELS[p]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1" />

          <span className="hidden sm:block text-[11px] text-muted-foreground/40 mr-1">
            ⌘↵ to submit
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            disabled={!title.trim() || loading}
            onClick={handleSubmit}
          >
            {loading ? 'Creating…' : 'Create issue'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
