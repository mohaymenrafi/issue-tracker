import * as React from 'react'
import type { IssueStatus } from '@/types'
import { cn } from '@/lib/utils'

interface StatusIconProps {
  status: IssueStatus
  className?: string
  size?: number
}

export function StatusIcon({ status, className, size = 16 }: StatusIconProps) {
  if (status === 'open') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        className={cn('shrink-0', className)}
        aria-label="Open"
      >
        <circle cx="8" cy="8" r="6.5" stroke="#6B7280" strokeWidth="1.5" fill="none" />
      </svg>
    )
  }

  if (status === 'in_progress') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        className={cn('shrink-0', className)}
        aria-label="In Progress"
      >
        <circle cx="8" cy="8" r="6.5" stroke="#F59E0B" strokeWidth="1.5" fill="none" />
        <path
          d="M8 1.5 A6.5 6.5 0 0 1 14.5 8 A6.5 6.5 0 0 1 8 14.5"
          stroke="#F59E0B"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="8" cy="8" r="3" fill="#F59E0B" opacity="0.3" />
      </svg>
    )
  }

  // closed
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={cn('shrink-0', className)}
      aria-label="Closed"
    >
      <circle cx="8" cy="8" r="6.5" fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="1.5" />
      <path
        d="M5 8.5L7 10.5L11 6"
        stroke="#10B981"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const STATUS_LABELS: Record<IssueStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  closed: 'Closed',
}
