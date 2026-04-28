import * as React from 'react'
import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors outline-none resize-none',
        'placeholder:text-muted-foreground',
        'focus:border-ring focus:ring-2 focus:ring-ring/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
