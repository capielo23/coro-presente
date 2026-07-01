export default function VoluntariosLoading() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Cabecera */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="skeleton h-8 w-56" />
          <div className="skeleton h-4 w-44" />
        </div>
        <div className="skeleton h-10 w-64 rounded-lg" />
      </div>

      {/* Bloque pendientes */}
      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5 space-y-3">
        <div className="skeleton h-5 w-48" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <div className="skeleton h-4 w-40" />
                <div className="skeleton h-3 w-52" />
                <div className="skeleton h-3 w-32" />
              </div>
              <div className="flex gap-2 shrink-0">
                <div className="skeleton h-8 w-20 rounded-lg" />
                <div className="skeleton h-8 w-20 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="skeleton h-4 w-40" />
        </div>
        <div className="divide-y divide-gray-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="skeleton h-4 w-36" />
                <div className="skeleton h-3 w-24" />
              </div>
              <div className="skeleton h-3 w-24 hidden sm:block" />
              <div className="flex gap-1">
                <div className="skeleton h-5 w-16 rounded-full" />
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
              <div className="skeleton h-5 w-16 rounded-full hidden sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
