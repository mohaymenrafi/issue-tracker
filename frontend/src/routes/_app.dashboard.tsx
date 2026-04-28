import { useState, useEffect, useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CircleDotIcon, FolderIcon, CheckCircle2Icon, ClockIcon } from 'lucide-react'
import { issuesApi, projectsApi } from '@/lib/api'
import type { Issue, Project } from '@/types'
import { useAuth } from '@/lib/auth'
import { IssueRow } from '@/components/issues/IssueRow'
import { Spinner } from '@/components/ui/spinner'

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardPage,
})

interface Stats {
  open: number
  in_progress: number
  closed: number
  total: number
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className={`mb-3 inline-flex size-8 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function DashboardPage() {
  const { user } = useAuth()
  const [issues, setIssues] = useState<Issue[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([issuesApi.list({ limit: 50 }), projectsApi.list({ limit: 50 })]).then(
      ([i, p]) => {
        setIssues(i)
        setProjects(p)
        setLoading(false)
      },
    )
  }, [])

  const stats: Stats = useMemo(
    () => ({
      open: issues.filter((i) => i.status === 'open').length,
      in_progress: issues.filter((i) => i.status === 'in_progress').length,
      closed: issues.filter((i) => i.status === 'closed').length,
      total: issues.length,
    }),
    [issues],
  )

  const recent = issues
    .slice()
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 8)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-foreground">
          {greeting()}, {user?.name ?? user?.username ?? 'there'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your issues.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
            <StatCard
              icon={<CircleDotIcon className="size-4 text-muted-foreground" />}
              label="Total Issues"
              value={stats.total}
              color="bg-muted"
            />
            <StatCard
              icon={<CircleDotIcon className="size-4 text-[#6B7280]" />}
              label="Open"
              value={stats.open}
              color="bg-[#374151]/30"
            />
            <StatCard
              icon={<ClockIcon className="size-4 text-amber-400" />}
              label="In Progress"
              value={stats.in_progress}
              color="bg-amber-500/10"
            />
            <StatCard
              icon={<CheckCircle2Icon className="size-4 text-emerald-400" />}
              label="Closed"
              value={stats.closed}
              color="bg-emerald-500/10"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent issues */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">Recent Issues</h2>
                <Link to="/issues" className="text-xs text-primary hover:underline">
                  View all
                </Link>
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                {recent.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No issues yet.{' '}
                    <span className="text-primary">Press C to create one.</span>
                  </div>
                ) : (
                  recent.map((issue) => (
                    <IssueRow
                      key={issue.id}
                      issue={issue}
                      className="last:border-0"
                    />
                  ))
                )}
              </div>
            </div>

            {/* Projects */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">Projects</h2>
                <Link to="/projects" className="text-xs text-primary hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-2">
                {projects.length === 0 ? (
                  <div className="rounded-lg border border-border py-8 text-center text-sm text-muted-foreground">
                    No projects yet.
                  </div>
                ) : (
                  projects.slice(0, 6).map((p) => {
                    const count = issues.filter((i) => i.project_id === p.id).length
                    return (
                      <Link
                        key={p.id}
                        to="/projects/$projectId"
                        params={{ projectId: String(p.id) }}
                        className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-card/80 transition-colors"
                      >
                        <div className="flex size-7 items-center justify-center rounded-md bg-primary/15 shrink-0">
                          <FolderIcon className="size-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{count} issue{count !== 1 ? 's' : ''}</p>
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
