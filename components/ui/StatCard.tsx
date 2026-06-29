interface StatCardProps {
  titulo: string
  valor: number | string
  icono: string
  colorFondo?: string
}

export default function StatCard({ titulo, valor, icono, colorFondo = 'bg-white' }: StatCardProps) {
  return (
    <div className={`${colorFondo} rounded-xl p-5 shadow-sm border border-gray-100`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{titulo}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{valor}</p>
        </div>
        <span className="text-3xl">{icono}</span>
      </div>
    </div>
  )
}
