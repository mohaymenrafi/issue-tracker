import { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { PlusIcon, FolderIcon, MoreHorizontalIcon, Trash2Icon, PencilIcon } from 'lucide-react'
import { toast } from 'sonner'
import { projectsApi, issuesApi } from '@/lib/api'
import type { Project, Issue } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export const Route = createFileRoute('/_app/projects')({
  component: ProjectsPage,
})

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)

  useEffect(() => {
    Promise.all([projectsApi.list({ limit: 100 }), issuesApi.list({ limit: 100 })]).then(
      ([p, i]) => {
        setProjects(p)
        setIssues(i)
        setLoading(false)
      },
    )
  }, [])

  async function handleDelete(id: number) {
    if (!confirm('Delete this project?')) return
    try {
      await projectsApi.delete(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      toast.success('Project deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  function issueCount(projectId: number) {
    return issues.filter((i) => i.project_id === projectId).length
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold">Projects</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Organize your issues into projects.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-4" />
          New Project
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 gap-3">
          <FolderIcon className="size-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No projects yet</p>
          <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const count = issueCount(p.id)
            return (
              <div
                key={p.id}
                className="group relative rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card/80 transition-all"
              >
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: String(p.id) }}
                  className="block p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 shrink-0">
                      <FolderIcon className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0 pr-6">
                      <h3 className="font-medium text-sm truncate">{p.name}</h3>
                      {p.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {p.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{count} issue{count !== 1 ? 's' : ''}</span>
                  </div>
                </Link>

                {/* Actions */}
                <div className="absolute top-3 right-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-md p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted transition-all focus:opacity-100">
                        <MoreHorizontalIcon className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditProject(p)}>
                        <PencilIcon className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2Icon className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <ProjectFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={(p) => {
          setProjects((prev) => [p, ...prev])
          setCreateOpen(false)
        }}
      />

      {/* Edit Project Modal */}
      {editProject && (
        <ProjectFormModal
          open={!!editProject}
          onOpenChange={(o) => !o && setEditProject(null)}
          project={editProject}
          onSaved={(updated) => {
            setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
            setEditProject(null)
          }}
        />
      )}
    </div>
  )
}

function ProjectFormModal({
  open,
  onOpenChange,
  project,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project
  onSaved: (p: Project) => void
}) {
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(project?.name ?? '')
      setDescription(project?.description ?? '')
    }
  }, [open, project])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const saved = project
        ? await projectsApi.update(project.id, { name, description: description || null })
        : await projectsApi.create({ name, description: description || null })
      toast.success(project ? 'Project updated' : 'Project created')
      onSaved(saved)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="px-6 pb-2 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="project-name">Name</Label>
              <Input
                id="project-name"
                placeholder="e.g. Backend API"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-desc">Description</Label>
              <Textarea
                id="project-desc"
                placeholder="What is this project about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!name.trim() || loading}>
              {loading ? 'Saving…' : project ? 'Save changes' : 'Create project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
