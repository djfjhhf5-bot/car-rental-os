"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

type ToastVariant = "default" | "destructive" | "success"

type Toast = {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
}

type Action =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "DISMISS_TOAST"; toastId: string }
  | { type: "REMOVE_TOAST"; toastId: string }

type State = {
  toasts: Toast[]
}

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) return

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: "REMOVE_TOAST", toastId })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }
    case "DISMISS_TOAST":
      addToRemoveQueue(action.toastId)
      return state
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}

type ToastOptions = {
  title?: string
  description?: string
  variant?: ToastVariant
}

function toast(opts: ToastOptions) {
  const id = genId()
  dispatch({
    type: "ADD_TOAST",
    toast: { ...opts, id },
  })
  addToRemoveQueue(id)
  return {
    id,
    dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }),
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (toastId: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
        success: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface ToastProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toastVariants> {
  id: string
  title?: string
  description?: string
  onClose?: () => void
}

const ToastComponent = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant, id, title, description, onClose, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        {...props}
      >
        <div className="grid gap-1">
          {title && <div className="text-sm font-semibold">{title}</div>}
          {description && <div className="text-sm opacity-90">{description}</div>}
        </div>
        <button
          onClick={onClose}
          className="absolute right-1 top-1 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }
)
ToastComponent.displayName = "Toast"

type ToastProviderProps = {
  children: React.ReactNode
}

function ToastProvider({ children }: ToastProviderProps) {
  const { toasts, dismiss } = useToast()

  return (
    <>
      {children}
      <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[420px]">
        {toasts.map((t) => (
          <ToastComponent
            key={t.id}
            id={t.id}
            title={t.title}
            description={t.description}
            variant={t.variant as ToastVariant}
            onClose={() => dismiss(t.id)}
          />
        ))}
      </div>
    </>
  )
}

export { ToastProvider, ToastComponent, toast, useToast, toastVariants }
export type { Toast }
