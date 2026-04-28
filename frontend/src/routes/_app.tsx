import { useState, useEffect } from 'react'
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { Sidebar } from '@/components/layout/Sidebar'
import { CreateIssueModal } from '@/components/issues/CreateIssueModal'
import { projectsApi } from '@/lib/api'
import type { Project } from '@/types'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  const navigate = useNavigate()
  const [newIssueOpen, setNewIssueOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])

  // Auth guard — runs client-side after SSR hydration
  useEffect(() => {
    if (!localStorage.getItem('auth_token')) {
      navigate({ to: '/login' })
    }
  }, [navigate])

  useEffect(() => {
    projectsApi
      .list({ limit: 100 })
      .then(setProjects)
      .catch(() => {})
  }, [])

  // Global keyboard shortcut: C = new issue (like Linear)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === 'c' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        setNewIssueOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar onNewIssue={() => setNewIssueOpen(true)} />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <CreateIssueModal
        open={newIssueOpen}
        onOpenChange={setNewIssueOpen}
        projects={projects}
      />
    </div>
  )
}
