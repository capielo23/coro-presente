import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const ESTADO_CASO_LABELS: Record<string, string> = {
  activo: 'Activo',
  estable: 'Estable',
  cerrado: 'Cerrado',
  critico: 'Crítico',
}

export const ESTADO_CASO_COLORS: Record<string, string> = {
  activo: 'bg-blue-100 text-blue-800',
  estable: 'bg-green-100 text-green-800',
  cerrado: 'bg-gray-100 text-gray-600',
  critico: 'bg-red-100 text-red-800',
}

export const CATEGORIA_LABELS: Record<string, string> = {
  alimentacion: '🍽️ Alimentación',
  ropa: '👕 Ropa y calzado',
  medicamentos: '💊 Medicamentos',
  traslado: '🚗 Traslado',
  alojamiento: '🏠 Alojamiento',
  hogar: '📦 Artículos del hogar',
  utiles: '🎒 Útiles escolares',
  ninos: '🧒 Niños',
  adulto_mayor: '👴 Adulto mayor',
  otro: '🔧 Otro',
}

export const ESTADO_NECESIDAD_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  en_gestion: 'bg-blue-100 text-blue-800',
  entregado: 'bg-green-100 text-green-800',
  recurrente: 'bg-purple-100 text-purple-800',
}
