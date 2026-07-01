import StatCard from '@/components/ui/StatCard'
import { Home, Users, FolderOpen, CheckCircle2 } from 'lucide-react'
import { CATEGORIA_LABELS } from '@/lib/utils'

interface Props {
  totalCasos: number
  totalFamilias: number
  totalPersonas: number
  casosCerrados: number
  necesidadesEntregadas: number
  necesidadesTotal: number
  topCategorias: Array<{ categoria: string; count: number }>
}

export default function EstadisticasAmpliadas({
  totalCasos,
  totalFamilias,
  totalPersonas,
  casosCerrados,
  necesidadesEntregadas,
  necesidadesTotal,
  topCategorias,
}: Props) {
  const casosActivos = Math.max(0, totalCasos - casosCerrados)
  const pctNecesidades = necesidadesTotal > 0
    ? Math.round((necesidadesEntregadas / necesidadesTotal) * 100)
    : 0

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Beneficiarios registrados</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard titulo="Familias atendidas"  valor={totalFamilias}  Icon={Home}         variant="default" />
        <StatCard titulo="Personas registradas" valor={totalPersonas}  Icon={Users}        variant="info"    />
        <StatCard titulo="Casos activos"       valor={casosActivos}   Icon={FolderOpen}   variant="warning" />
        <StatCard titulo="Casos resueltos"     valor={casosCerrados}  Icon={CheckCircle2} variant="default" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 grid sm:grid-cols-2 gap-5">
        {/* Barra de progreso de necesidades */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Necesidades cubiertas</p>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full bg-green-500 transition-all"
                style={{ width: `${pctNecesidades}%` }}
              />
            </div>
            <span className="text-sm font-bold text-green-700 shrink-0">{pctNecesidades}%</span>
          </div>
          <p className="text-xs text-gray-400">
            {necesidadesEntregadas} de {necesidadesTotal} necesidades atendidas
          </p>
        </div>

        {/* Top categorías */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Más solicitadas</p>
          {topCategorias.length > 0 ? (
            <ol className="space-y-1">
              {topCategorias.map(({ categoria, count }, i) => (
                <li key={categoria} className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}.</span>
                  <span className="text-gray-700 flex-1">{CATEGORIA_LABELS[categoria] ?? categoria}</span>
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{count}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-gray-400 text-sm">Sin datos aún.</p>
          )}
        </div>
      </div>
    </div>
  )
}
