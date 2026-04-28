import * as React from 'react'
import type { IssuePriority } from '@/types'
import { cn } from '@/lib/utils'

interface PriorityIconProps {
  priority: IssuePriority
  className?: string
  size?: number
}

export function PriorityIcon({ priority, className, size = 14 }: PriorityIconProps) {
  const colors: Record<IssuePriority, { bar: string; dim: string }> = {
    high: { bar: '#F97316', dim: '#F9731640' },
    medium: { bar: '#F59E0B', dim: '#F59E0B40' },
    low: { bar: '#6B7280', dim: '#6B728040' },
  }

  const c = colors[priority]
  const bars = { high: 3, medium: 2, low: 1 }[priority]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      className={cn('shrink-0', className)}
      aria-label={`${priority} priority`}
    >
      {/* Bar 1 (left, shortest) */}
      <rect x="1" y="9" width="3" height="4" rx="0.5" fill={bars >= 1 ? c.bar : c.dim} />
      {/* Bar 2 (middle) */}
      <rect x="5.5" y="6" width="3" height="7" rx="0.5" fill={bars >= 2 ? c.bar : c.dim} />
      {/* Bar 3 (right, tallest) */}
      <rect x="10" y="2" width="3" height="11" rx="0.5" fill={bars >= 3 ? c.bar : c.dim} />
    </svg>
  )
}

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}
