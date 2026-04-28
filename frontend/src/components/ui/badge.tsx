import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'bg-primary/15 text-primary border border-primary/20',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border border-border text-foreground',
        open: 'bg-[#374151]/50 text-[#9CA3AF] border border-[#374151]/60',
        in_progress: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
        closed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
        high: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
        medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
        low: 'bg-[#374151]/50 text-[#9CA3AF] border border-[#374151]/60',
        destructive: 'bg-destructive/15 text-destructive border border-destructive/20',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
