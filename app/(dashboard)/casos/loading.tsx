export default function CasosLoading() {
  return (
    <div className="space-y-5 max-w-6xl">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-32" />
        </div>
        <div className="skeleton h-9 w-36 rounded-lg" />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <div className="skeleton h-10 flex-1 min-w-36 rounded-lg" />
        <div className="skeleton h-10 w-44 rounded-lg" />
        <div className="skeleton h-10 w-36 rounded-lg" />
        <div className="skeleton h-10 w-20 rounded-lg" />
      </div>

      {/* Grid de tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
            {/* Nombre + badge estado */}
            <div className="flex items-start justify-between gap-2">
              <div className="skeleton h-4 flex-1 rounded" />
              <div className="skeleton h-5 w-14 rounded-full shrink-0" />
            </div>
            {/* Detalles */}
            <div className="space-y-1.5">
              <div className="skeleton h-3 w-40" />
              <div className="skeleton h-3 w-28" />
            </div>
            {/* Tutor */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="skeleton h-5 w-28 rounded-full" />
              <div className="skeleton h-3 w-10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
