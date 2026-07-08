'use client'
import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

export interface ToastItem { id: number; msg: string }

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  function showToast(msg: string) {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }
  return { toasts, showToast }
}

export default function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="flex items-center gap-2.5 bg-gray-900/95 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl"
        >
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
