'use client'
import { createContext, useContext, useReducer, useCallback, useRef } from 'react'
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  success: (msg: string) => void
  error: (msg: string) => void
  info: (msg: string) => void
}

type Action =
  | { type: 'ADD'; toast: Toast }
  | { type: 'REMOVE'; id: number }

const ToastContext = createContext<ToastContextValue | null>(null)

function reducer(state: Toast[], action: Action): Toast[] {
  if (action.type === 'ADD') return [...state, action.toast]
  return state.filter(t => t.id !== action.id)
}

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: AlertCircle,
}

const STYLES = {
  success: 'bg-white border-green-300 text-green-800',
  error:   'bg-white border-red-300 text-red-800',
  info:    'bg-white border-cyan-300 text-cyan-800',
}

const ICON_COLORS = {
  success: 'text-green-500',
  error:   'text-red-500',
  info:    'text-cyan-500',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, [])
  const counter = useRef(0)

  const show = useCallback((type: ToastType, message: string) => {
    const id = ++counter.current
    dispatch({ type: 'ADD', toast: { id, type, message } })
    setTimeout(() => dispatch({ type: 'REMOVE', id }), 4000)
  }, [])

  const value: ToastContextValue = {
    success: (msg) => show('success', msg),
    error:   (msg) => show('error', msg),
    info:    (msg) => show('info', msg),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Portal de toasts — esquina superior derecha */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
        style={{ maxWidth: 'min(360px, calc(100vw - 2rem))' }}
      >
        {toasts.map(t => {
          const Icon = ICONS[t.type]
          return (
            <div
              key={t.id}
              role="alert"
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg pointer-events-auto animate-in slide-in-from-right-4 fade-in duration-200 ${STYLES[t.type]}`}
            >
              <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${ICON_COLORS[t.type]}`} />
              <p className="text-sm leading-snug flex-1">{t.message}</p>
              <button
                onClick={() => dispatch({ type: 'REMOVE', id: t.id })}
                className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
