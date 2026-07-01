export type RolVoluntario = 'admin' | 'coordinador' | 'voluntario'
export type EstadoVoluntario = 'pendiente' | 'aprobado' | 'rechazado'
export type TipoCaso = 'individual' | 'familiar'
export type EstadoCaso = 'activo' | 'estable' | 'cerrado' | 'critico'
export type EstadoNecesidad = 'pendiente' | 'en_gestion' | 'entregado' | 'parcial' | 'recurrente'
export type CategoriaNecesidad =
  | 'alimentacion' | 'ropa' | 'medicamentos' | 'traslado'
  | 'alojamiento' | 'hogar' | 'utiles' | 'ninos' | 'adulto_mayor' | 'otro'

export interface Voluntario {
  id: string
  nombre_completo: string
  cedula?: string
  telefono: string
  rol: RolVoluntario
  estado: EstadoVoluntario
  created_at: string
  areas_ayuda?: string[]
  especialidades?: string[]
  zona_cobertura?: string
  disponibilidad?: string
  descripcion_ayuda?: string
  puede_aprobar_coordinadores?: boolean
}

export interface Caso {
  id: string
  tipo: TipoCaso
  nombre_caso: string
  num_integrantes: number
  foto_grupo_url?: string
  ciudad_origen?: string
  estado_origen?: string
  zona_afectada?: string
  direccion_actual?: string
  tipo_alojamiento?: string
  estado: EstadoCaso
  tutor_id?: string
  registrado_por: string
  created_at: string
  updated_at: string
  tutor?: Voluntario
  personas?: Persona[]
  necesidades?: Necesidad[]
}

export interface Persona {
  id: string
  caso_id: string
  nombre: string
  apellido: string
  cedula?: string
  fecha_nacimiento?: string
  edad_aprox?: number
  sexo?: 'M' | 'F' | 'no_especificado'
  rol_familia?: string
  condicion_especial?: string
  telefono?: string
  foto_url?: string
}

export interface Necesidad {
  id: string
  caso_id: string
  categoria: CategoriaNecesidad
  descripcion?: string
  estado: EstadoNecesidad
  es_recurrente: boolean
  frecuencia?: string
  proxima_fecha?: string
  persona_id?: string | null
  entregado_por?: string
  fecha_entrega?: string
  descripcion_entrega?: string
  registrado_por: string
  created_at: string
}
