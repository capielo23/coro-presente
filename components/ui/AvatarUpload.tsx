'use client'
import { useRef, useState } from 'react'
import { Camera, Upload, Loader2, CheckCircle2, UserCircle, Trash2 } from 'lucide-react'
import Image from 'next/image'

interface Props {
  currentUrl: string | null
  nombre: string
}

export default function AvatarUpload({ currentUrl, nombre }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [liveUrl, setLiveUrl] = useState<string | null>(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function abrirSelector() {
    inputRef.current?.click()
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setOk(false)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
  }

  async function confirmarUpload() {
    const file = inputRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')

    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await fetch('/api/voluntarios/avatar', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al subir la foto')
        setUploading(false)
        return
      }

      if (data.aviso) setError(data.aviso)

      if (preview) URL.revokeObjectURL(preview)
      setPreview(null)
      if (data.url) setLiveUrl(data.url)
      if (!data.aviso) setOk(true)
      if (inputRef.current) inputRef.current.value = ''
      setTimeout(() => setOk(false), 3500)
    } catch {
      setError('Error de red al subir la foto')
    }
    setUploading(false)
  }

  function cancelarPreview() {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function eliminarFoto() {
    setDeleting(true)
    setError('')
    try {
      const res = await fetch('/api/voluntarios/avatar', { method: 'DELETE' })
      if (res.ok) {
        setLiveUrl(null)
      } else {
        const data = await res.json()
        setError(data.error || 'Error al eliminar la foto')
      }
    } catch {
      setError('Error de red al eliminar la foto')
    }
    setDeleting(false)
  }

  const displayed = preview ?? liveUrl
  const initials = nombre.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div className="flex items-start gap-4">
      {/* Input de archivo — oculto, disparado programáticamente */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        aria-label="Seleccionar foto de perfil"
      />

      {/* Avatar circular */}
      <div className="relative shrink-0">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-cyan-50 border-2 border-cyan-200 flex items-center justify-center select-none">
          {displayed ? (
            <Image
              src={displayed}
              alt={`Foto de ${nombre}`}
              width={80}
              height={80}
              className="w-full h-full object-cover"
              unoptimized={!!preview}
            />
          ) : initials ? (
            <span className="text-xl font-bold text-cyan-400">{initials}</span>
          ) : (
            <UserCircle className="w-12 h-12 text-cyan-300" strokeWidth={1.25} />
          )}
        </div>

        {preview && !ok && (
          <span
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-white"
            title="Pendiente de guardar"
          />
        )}
        {ok && (
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </span>
        )}
      </div>

      {/* Controles */}
      <div className="flex-1 min-w-0 pt-1">
        <p className="text-sm font-medium text-gray-700 mb-0.5">Foto de identificación</p>
        <p className="text-xs text-gray-400 mb-3">
          JPEG, PNG o WebP · máx. 5 MB.
          <span className="hidden sm:inline"> En el teléfono puedes tomar la foto al momento.</span>
        </p>

        {!preview ? (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={abrirSelector}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-cyan-400 hover:bg-cyan-50 text-gray-700 hover:text-cyan-700 text-xs font-medium px-3 py-2 rounded-lg transition"
            >
              <Camera className="w-4 h-4 shrink-0" />
              {liveUrl ? 'Cambiar foto' : 'Agregar foto'}
            </button>

            {liveUrl && (
              <button
                type="button"
                onClick={eliminarFoto}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 px-2 py-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
              >
                {deleting
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />}
                {deleting ? 'Eliminando…' : 'Quitar foto'}
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={confirmarUpload}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 bg-[#0891B2] hover:bg-[#0C4A6E] text-white text-xs font-medium px-3 py-2 rounded-lg transition disabled:opacity-60"
            >
              {uploading
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Subiendo…</>
                : <><Upload className="w-3.5 h-3.5" /> Guardar foto</>}
            </button>
            <button
              type="button"
              onClick={cancelarPreview}
              disabled={uploading}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-2 transition"
            >
              Cancelar
            </button>
          </div>
        )}

        {error && (
          <p className="mt-2 text-xs text-red-600">{error}</p>
        )}
        {ok && (
          <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Foto guardada
          </p>
        )}
      </div>
    </div>
  )
}
