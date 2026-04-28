import * as React from 'react'
import { Dialog } from 'radix-ui'
import { XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const DialogRoot = Dialog.Root
const DialogTrigger = Dialog.Trigger
const DialogClose = Dialog.Close
const DialogPortal = Dialog.Portal

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof Dialog.Overlay>) {
  return (
    <Dialog.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showClose = true,
  ...props
}: React.ComponentProps<typeof Dialog.Content> & { showClose?: boolean }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <Dialog.Content
        data-slot="dialog-content"
        className={cn(
          'fixed top-[50%] left-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]',
          'bg-card border border-white/10 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.6)]',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'duration-200',
          className,
        )}
        {...props}
      >
        {children}
        {showClose && (
          <Dialog.Close className="absolute top-4 right-4 rounded-md p-0.5 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
        )}
      </Dialog.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-1.5 px-6 pt-6 pb-2', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex items-center justify-end gap-2 px-6 py-4 border-t border-border', className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof Dialog.Title>) {
  return (
    <Dialog.Title
      data-slot="dialog-title"
      className={cn('text-base font-semibold leading-none', className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof Dialog.Description>) {
  return (
    <Dialog.Description
      data-slot="dialog-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  DialogRoot as Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
