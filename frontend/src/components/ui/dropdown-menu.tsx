import * as React from 'react'
import { DropdownMenu } from 'radix-ui'
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const DropdownMenuRoot = DropdownMenu.Root
const DropdownMenuTrigger = DropdownMenu.Trigger
const DropdownMenuGroup = DropdownMenu.Group
const DropdownMenuPortal = DropdownMenu.Portal
const DropdownMenuSub = DropdownMenu.Sub
const DropdownMenuRadioGroup = DropdownMenu.RadioGroup

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenu.SubTrigger> & { inset?: boolean }) {
  return (
    <DropdownMenu.SubTrigger
      className={cn(
        'flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent',
        inset && 'pl-8',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenu.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenu.SubContent>) {
  return (
    <DropdownMenu.SubContent
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof DropdownMenu.Content>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[8rem] overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          className,
        )}
        {...props}
      />
    </DropdownMenu.Portal>
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof DropdownMenu.Item> & {
  inset?: boolean
  variant?: 'default' | 'destructive'
}) {
  return (
    <DropdownMenu.Item
      data-variant={variant}
      className={cn(
        'relative flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors',
        'focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        variant === 'destructive' && 'text-destructive focus:bg-destructive/10 focus:text-destructive',
        inset && 'pl-8',
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenu.CheckboxItem>) {
  return (
    <DropdownMenu.CheckboxItem
      className={cn(
        'relative flex cursor-default select-none items-center rounded-md py-1.5 pr-2 pl-8 text-sm outline-none transition-colors',
        'focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenu.ItemIndicator>
          <CheckIcon className="size-3.5" />
        </DropdownMenu.ItemIndicator>
      </span>
      {children}
    </DropdownMenu.CheckboxItem>
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenu.RadioItem>) {
  return (
    <DropdownMenu.RadioItem
      className={cn(
        'relative flex cursor-default select-none items-center rounded-md py-1.5 pr-2 pl-8 text-sm outline-none transition-colors',
        'focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenu.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenu.ItemIndicator>
      </span>
      {children}
    </DropdownMenu.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenu.Label> & { inset?: boolean }) {
  return (
    <DropdownMenu.Label
      className={cn(
        'px-2 py-1.5 text-xs font-medium text-muted-foreground',
        inset && 'pl-8',
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenu.Separator>) {
  return (
    <DropdownMenu.Separator
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest text-muted-foreground/60', className)}
      {...props}
    />
  )
}

export {
  DropdownMenuRoot as DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
