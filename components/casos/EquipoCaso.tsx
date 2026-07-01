import { ShieldCheck, UserPlus, Users, HandHeart } from 'lucide-react'

interface Props {
  responsable: string | null
  registrador: string | null
  colaboradores: string[]
  entregadores: string[]
}

function Chips({ nombres, vacio }: { nombres: string[]; vacio: string }) {
  if (nombres.length === 0) return <span className="text-xs text-gray-400">{vacio}</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {nombres.map((n, i) => (
        <span key={i} className="text-xs bg-white text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full">{n}</span>
      ))}
    </div>
  )
}

export default function EquipoCaso({ responsable, registrador, colaboradores, entregadores }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-4 h-4 text-cyan-600" />
        <h3 className="font-semibold text-gray-800">Equipo del caso</h3>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Quiénes gestionan este caso y participan en la ayuda. Transparencia para la comunidad y los donantes.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-400">Responsable del caso</p>
            <p className="font-medium text-gray-800">{responsable || <span className="text-amber-600">Sin asignar</span>}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <UserPlus className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-400">Registró el caso</p>
            <p className="font-medium text-gray-800">{registrador || '—'}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Users className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs text-gray-400 mb-1">Colaboradores</p>
            <Chips nombres={colaboradores} vacio="Ninguno aún" />
          </div>
        </div>
        <div className="flex items-start gap-2">
          <HandHeart className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs text-gray-400 mb-1">Participaron en entregas</p>
            <Chips nombres={entregadores} vacio="Aún sin entregas registradas" />
          </div>
        </div>
      </div>
    </div>
  )
}
