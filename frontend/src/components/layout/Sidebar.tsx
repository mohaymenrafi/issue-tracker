import { useState, useEffect } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import {
  LayoutDashboardIcon,
  CircleDotIcon,
  FolderIcon,
  SettingsIcon,
  LogOutIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  ZapIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'
import { projectsApi } from '@/lib/api'
import type { Project } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface SidebarProps {
  onNewIssue?: () => void
}

function NavItem({
  to,
  icon,
  label,
  exact = false,
}: {
  to: string
  icon: React.ReactNode
  label: string
  exact?: boolean
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
      activeProps={{ className: 'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] bg-sidebar-accent text-sidebar-foreground transition-colors' }}
    >
      <span className="shrink-0 opacity-75">{icon}</span>
      {label}
    </Link>
  )
}

export function Sidebar({ onNewIssue }: SidebarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsOpen, setProjectsOpen] = useState(true)

  useEffect(() => {
    projectsApi
      .list({ limit: 50 })
      .then(setProjects)
      .catch(() => {})
  }, [])

  function handleLogout() {
    logout()
    toast.success('Logged out')
    router.navigate({ to: '/login' })
  }

  const initials = user
    ? (user.name ?? user.username)
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?'

  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Workspace header */}
      <div className="flex items-center gap-2.5 px-3 py-3.5 border-b border-sidebar-border/60">
        <div className="flex size-6 items-center justify-center rounded-md bg-primary/90 shrink-0">
          <ZapIcon className="size-3.5 text-primary-foreground" />
        </div>
        <span className="text-[13px] font-semibold text-sidebar-foreground truncate">
          {user?.name ?? user?.username ?? 'Workspace'}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        <NavItem to="/dashboard" icon={<LayoutDashboardIcon className="size-4" />} label="Dashboard" />
        <NavItem to="/issues" icon={<CircleDotIcon className="size-4" />} label="Issues" />

        <div className="pt-3 pb-1">
          <button
            onClick={() => setProjectsOpen((o) => !o)}
            className="flex w-full items-center gap-1 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 hover:text-sidebar-foreground/60 transition-colors"
          >
            {projectsOpen ? (
              <ChevronDownIcon className="size-3" />
            ) : (
              <ChevronRightIcon className="size-3" />
            )}
            Projects
          </button>
        </div>

        {projectsOpen && (
          <div className="space-y-0.5">
            <NavItem
              to="/projects"
              icon={<FolderIcon className="size-4" />}
              label="All Projects"
              exact
            />
            {projects.map((p) => (
              <Link
                key={p.id}
                to="/projects/$projectId"
                params={{ projectId: String(p.id) }}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                activeProps={{
                  className:
                    'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] bg-sidebar-accent text-sidebar-foreground transition-colors',
                }}
              >
                <span className="size-4 flex items-center justify-center shrink-0">
                  <span className="size-2 rounded-sm bg-primary/60" />
                </span>
                <span className="truncate">{p.name}</span>
              </Link>
            ))}
            {projects.length === 0 && (
              <span className="block px-5 py-1 text-[12px] text-sidebar-foreground/30">
                No projects yet
              </span>
            )}
          </div>
        )}

        <div className="pt-3">
          <NavItem to="/settings" icon={<SettingsIcon className="size-4" />} label="Settings" />
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border/60 p-2">
        {/* New issue button */}
        <button
          onClick={onNewIssue}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] font-medium text-primary hover:bg-primary/10 transition-colors mb-1"
        >
          <PlusIcon className="size-4" />
          New Issue
          <span className="ml-auto text-[10px] text-muted-foreground/50 font-normal">C</span>
        </button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
              <Avatar className="size-6">
                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-left">
                {user?.name ?? user?.username ?? 'Account'}
              </span>
              <ChevronDownIcon className="size-3 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name ?? user?.username}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOutIcon className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
