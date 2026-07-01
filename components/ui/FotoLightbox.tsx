'use client'
import { useState } from 'react'

interface Props {
  src: string
  nombre: string
  className?: string
}

export default function FotoLightbox({ src, nombre, className = '' }: Props) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={`block overflow-hidden rounded-lg cursor-zoom-in hover:opacity-90 transition ${className}`}
        title="Ver foto completa"
      >
        <img src={src} alt={nombre} className="w-full h-full object-cover" />
      </button>

      {abierto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setAbierto(false)}
        >
          <div
            className="relative max-w-2xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={src}
              alt={nombre}
              className="w-full rounded-xl object-contain max-h-[80vh]"
            />
            <button
              onClick={() => setAbierto(false)}
              className="absolute top-3 right-3 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80 transition text-sm font-bold"
              aria-label="Cerrar"
            >
              ✕
            </button>
            <p className="text-white text-center mt-3 text-sm font-medium">{nombre}</p>
          </div>
        </div>
      )}
    </>
  )
}
