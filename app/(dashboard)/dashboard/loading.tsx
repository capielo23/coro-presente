export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Título */}
      <div className="space-y-2">
        <div className="skeleton h-8 w-56" />
        <div className="skeleton h-4 w-40" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-20" />
              <div className="skeleton h-7 w-10" />
            </div>
          </div>
        ))}
      </div>

      {/* Paneles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="skeleton h-5 w-36" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <div className="skeleton h-3 w-12 shrink-0" />
                <div className="skeleton h-2 flex-1 rounded-full" />
                <div className="skeleton h-3 w-4 shrink-0" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Mis casos */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="skeleton h-5 w-44" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="skeleton w-7 h-7 rounded-lg shrink-0" />
              <div className="skeleton h-4 w-40" />
            </div>
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
