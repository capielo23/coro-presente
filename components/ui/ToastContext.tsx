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
  error:   (msg: string) => void
  info:    (msg: string) => void
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
  error:   XCircle,
  info:    AlertCircle,
}

const STYLES: Record<ToastType, React.CSSProperties> = {
  success: { borderColor: '#86efac', color: '#166534' },
  error:   { borderColor: '#fca5a5', color: '#991b1b' },
  info:    { borderColor: '#67e8f9', color: '#155e75' },
}

const ICON_COLORS: Record<ToastType, string> = {
  success: '#22c55e',
  error:   '#ef4444',
  info:    '#06b6d4',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, [])
  const counter = useRef(0)

  const show = useCallback((type: ToastType, message: string) => {
    const id = ++counter.current
    dispatch({ type: 'ADD', toast: { id, type, message } })
    setTimeout(() => dispatch({ type: 'REMOVE', id }), 4500)
  }, [])

  const value: ToastContextValue = {
    success: (msg) => show('success', msg),
    error:   (msg) => show('error', msg),
    info:    (msg) => show('info', msg),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxWidth: 'min(360px, calc(100vw - 2rem))',
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => {
          const Icon = ICONS[t.type]
          return (
            <div
              key={t.id}
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                pointerEvents: 'auto',
                ...STYLES[t.type],
              }}
            >
              <Icon
                style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, color: ICON_COLORS[t.type] }}
              />
              <p style={{ fontSize: '0.875rem', lineHeight: '1.4', flex: 1, margin: 0 }}>
                {t.message}
              </p>
              <button
                onClick={() => dispatch({ type: 'REMOVE', id: t.id })}
                style={{
                  flexShrink: 0,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: 0,
                  lineHeight: 1,
                }}
                aria-label="Cerrar"
              >
                <X style={{ width: 14, height: 14 }} />
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
