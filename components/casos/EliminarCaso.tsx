'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle, X } from 'lucide-react'
import { useToast } from '@/components/ui/ToastContext'

export default function EliminarCaso({ casoId, nombreCaso }: { casoId: string; nombreCaso?: string }) {
  const router = useRouter()
  const toast = useToast()
  const [abierto, setAbierto] = useState(false)
  const [aceptado, setAceptado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function eliminar() {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/casos/${casoId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('del')
      toast.success(nombreCaso ? `Caso "${nombreCaso}" eliminado` : 'Caso eliminado')
      router.refresh()
      router.push('/casos')
    } catch {
      setError('No se pudo eliminar el caso. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { setAceptado(false); setError(''); setAbierto(true) }}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 transition"
      >
        <Trash2 className="w-3.5 h-3.5" /> Eliminar caso
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => !loading && setAbierto(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-bold text-gray-900">Eliminar caso</h3>
              </div>
              <button onClick={() => !loading && setAbierto(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600">
              Vas a eliminar {nombreCaso ? <span className="font-semibold text-gray-800">{nombreCaso}</span> : 'este caso'} de forma permanente.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">
              Se borrarán el caso, sus integrantes, necesidades, entregas, seguimientos y todo su historial.
              <span className="font-semibold"> Los datos NO se podrán recuperar.</span>
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={aceptado} onChange={e => setAceptado(e.target.checked)} className="accent-red-600 mt-0.5" />
              Entiendo que esta acción es permanente y no se puede deshacer.
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setAbierto(false)} disabled={loading}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={eliminar} disabled={!aceptado || loading}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 btn-press">
                <Trash2 className="w-4 h-4" />
                {loading ? 'Eliminando...' : 'Sí, eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
