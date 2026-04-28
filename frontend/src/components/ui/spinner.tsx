import * as React from 'react'
import { cn } from '@/lib/utils'

function Spinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = { sm: 'size-3.5', md: 'size-5', lg: 'size-7' }[size]
  return (
    <svg
      className={cn('animate-spin text-muted-foreground', sizeClass, className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export { Spinner }
