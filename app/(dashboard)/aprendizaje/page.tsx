import React from 'react'
import Link from 'next/link'
import {
  Home, Users, UserCheck, Settings, PlusCircle, ClipboardList,
  Check, X, HelpCircle, Search, ChevronRight, ArrowRight
} from 'lucide-react'

function Seccion({ numero, titulo, Icon, children }: {
  numero: string; titulo: string; Icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-cyan-600" />
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{numero}</p>
          <h3 className="font-bold text-gray-900 text-base leading-tight">{titulo}</h3>
        </div>
      </div>
      {children}
    </div>
  )
}

function Paso({ numero, texto }: { numero: number; texto: string }) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-[#0891B2] text-white text-xs flex items-center justify-center font-bold mt-0.5">
        {numero}
      </span>
      <p className="text-sm text-gray-700 leading-relaxed">{texto}</p>
    </div>
  )
}

function RolCard({ Icon, titulo, descripcion, puede, noPuede }: {
  Icon: React.ElementType; titulo: string; descripcion: string;
  puede: string[]; noPuede?: string[]
}) {
  return (
    <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-muted)]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-cyan-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-cyan-600" />
        </div>
        <p className="font-semibold text-gray-900 text-sm">{titulo}</p>
      </div>
      <p className="text-xs text-gray-500 mb-3">{descripcion}</p>
      <div className="space-y-1.5">
        {puede.map((p, i) => (
          <p key={i} className="text-xs text-green-700 flex gap-2 items-start">
            <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {p}
          </p>
        ))}
        {noPuede?.map((p, i) => (
          <p key={i} className="text-xs text-gray-400 flex gap-2 items-start">
            <X className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {p}
          </p>
        ))}
      </div>
    </div>
  )
}

export default function AprendizajePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Centro de aprendizaje</h2>
        <p className="text-gray-500 text-sm mt-1">
          Todo lo que necesitas saber para usar Coro Presente de forma efectiva.
          El sistema está diseñado para que cualquier persona pueda ayudar sin capacitación previa.
        </p>
      </div>

      {/* Sección 1 */}
      <Seccion numero="Primero" titulo="¿Qué es Coro Presente?" Icon={Home}>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          Coro Presente es una herramienta para organizar la ayuda humanitaria a personas afectadas por el terremoto en Coro, Falcón.
          Permite registrar casos, hacer seguimiento de necesidades y coordinar entre voluntarios — todo desde el teléfono.
        </p>
        <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3 text-sm text-[var(--color-foreground)]">
          <strong>Principio fundamental:</strong> La información que registras en esta plataforma es
          confidencial. Nunca compartas datos personales de los afectados fuera del sistema.
        </div>
      </Seccion>

      {/* Sección 2 */}
      <Seccion numero="Segundo" titulo="¿Cómo funcionan los roles?" Icon={Users}>
        <p className="text-sm text-gray-600 mb-4">
          No hay jerarquía rígida. Todos los voluntarios pueden registrar casos y trabajar en necesidades.
          La diferencia está en quién se compromete a hacer <em>seguimiento</em>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <RolCard
            Icon={Users}
            titulo="Voluntario libre"
            descripcion="Cualquier persona aprobada en el sistema."
            puede={['Registrar nuevos casos', 'Tomar y entregar necesidades', 'Agregar información a fichas']}
            noPuede={['Cerrar un caso']}
          />
          <RolCard
            Icon={UserCheck}
            titulo="Tutor del caso"
            descripcion="El voluntario que tomó el seguimiento de un caso específico."
            puede={['Todo lo de voluntario libre', 'Cerrar el caso cuando esté resuelto', 'Liberar el caso si no puede seguir']}
          />
          <RolCard
            Icon={Settings}
            titulo="Coordinador"
            descripcion="Administra el sistema y tiene acceso completo."
            puede={['Todo lo de tutor', 'Aprobar nuevos voluntarios', 'Reasignar tutores', 'Ver todos los datos']}
          />
        </div>

        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-sm text-amber-800">
            <strong>¿Cómo me convierto en tutor?</strong> Al registrar un caso el sistema te pregunta si quieres
            tomar el seguimiento. Si dices que sí, quedas como tutor inmediatamente. También puedes tomar
            el seguimiento de cualquier caso que no tenga tutor asignado.
          </p>
        </div>
      </Seccion>

      {/* Sección 3 */}
      <Seccion numero="Tercero" titulo="Cómo registrar un caso" Icon={PlusCircle}>
        <div className="space-y-3 mb-4">
          <Paso numero={1} texto="Ve a 'Nuevo registro' en el menú lateral." />
          <Paso numero={2} texto="Selecciona si es una persona individual o un grupo familiar." />
          <Paso numero={3} texto="Completa los datos de origen: ciudad y barrio donde vivían antes del terremoto." />
          <Paso numero={4} texto="Indica dónde están alojados actualmente en Coro: tipo de alojamiento, sector y dirección." />
          <Paso numero={5} texto="Agrega los datos de cada integrante. Solo Nombre y Apellido son obligatorios. La cédula ayuda a evitar registros duplicados." />
          <Paso numero={6} texto="Al final, el sistema te pregunta si quieres tomar el seguimiento del caso o dejarlo disponible para otro voluntario." />
          <Paso numero={7} texto="Haz clic en 'Registrar caso'. Serás redirigido a la ficha del caso donde puedes agregar necesidades." />
        </div>
        <div className="bg-[var(--color-muted)] rounded-xl p-3 text-xs text-gray-500 border border-[var(--color-border)]">
          Si intentas registrar a alguien con una cédula que ya está en el sistema, recibirás una alerta
          para evitar duplicados. Revisa el registro existente antes de crear uno nuevo.
        </div>
      </Seccion>

      {/* Sección 4 */}
      <Seccion numero="Cuarto" titulo="Cómo gestionar las necesidades" Icon={ClipboardList}>
        <p className="text-sm text-gray-600 mb-4">
          Cada caso puede tener múltiples necesidades: ropa, medicamentos, alimentos, documentos, etc.
          El seguimiento de cada una es independiente.
        </p>

        <div className="flex items-center gap-2 flex-wrap mb-5">
          {[
            { color: 'bg-amber-100 text-amber-800', label: 'Pendiente' },
            { color: 'bg-cyan-100 text-cyan-800', label: 'En gestión' },
            { color: 'bg-green-100 text-green-800', label: 'Entregado' },
          ].map((step, i, arr) => (
            <React.Fragment key={step.label}>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${step.color}`}>
                {step.label}
              </span>
              {i < arr.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-gray-300" />}
            </React.Fragment>
          ))}
          <span className="text-xs text-gray-400 ml-1">o</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 ml-1">Parcial</span>
        </div>

        <div className="space-y-3">
          <Paso numero={1} texto="Abre la ficha del caso y busca la sección 'Necesidades'." />
          <Paso numero={2} texto="Haz clic en 'Agregar necesidad' para registrar lo que la persona necesita. Puedes describir varios artículos separados por comas: 'pantalón talla 30, franela M, calzado 38'." />
          <Paso numero={3} texto="Cuando vayas a gestionar una necesidad, haz clic en 'Tomar en gestión'. Esto avisa a los demás que ya alguien está trabajando en eso, evitando duplicar esfuerzos." />
          <Paso numero={4} texto="Al marcar como entregado, si la descripción tiene varios artículos, el sistema te muestra una lista de verificación. Marca solo lo que realmente se entregó." />
          <Paso numero={5} texto="Si solo entregaste parte de los artículos, el estado queda como 'Parcial' con el conteo visible (ej: 2/5). Puedes actualizarlo más adelante." />
        </div>
      </Seccion>

      {/* Sección 5 */}
      <Seccion numero="Quinto" titulo="Trabajo en equipo sin conflictos" Icon={Users}>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          El sistema está diseñado para que varios voluntarios puedan trabajar en el mismo caso sin pisarse.
        </p>
        <div className="space-y-3">
          {[
            {
              color: 'border-cyan-400',
              titulo: 'El estado "En gestión" te protege',
              texto: 'Cuando tomas una necesidad en gestión, aparece marcada como tal. Si otro voluntario entra a la ficha, verá que ya alguien la está atendiendo y no empezará a trabajar en lo mismo.',
            },
            {
              color: 'border-green-400',
              titulo: 'El tutor coordina, no controla',
              texto: 'Cualquier voluntario puede colaborar en cualquier caso, ya sea trabajando en necesidades o uniéndose formalmente como colaborador. El tutor solo tiene el privilegio adicional de cerrar el caso cuando considera que está resuelto.',
            },
            {
              color: 'border-amber-400',
              titulo: 'Si no puedes seguir con un caso',
              texto: 'Si eres tutor de un caso y ya no puedes darle seguimiento, entra a la ficha y usa "Liberar este caso". El caso volverá a estar disponible para que otro voluntario lo tome. No lo dejes sin aviso — alguien depende de ese seguimiento.',
            },
          ].map(item => (
            <div key={item.titulo} className={`border-l-4 ${item.color} pl-4`}>
              <p className="text-sm font-semibold text-gray-800">{item.titulo}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.texto}</p>
            </div>
          ))}
        </div>
      </Seccion>

      {/* Sección 6 */}
      <Seccion numero="Sexto" titulo="Preguntas frecuentes" Icon={HelpCircle}>
        <div className="space-y-4">
          {[
            {
              q: '¿Puedo entregar una necesidad aunque no sea el tutor del caso?',
              a: 'Sí. Cualquier voluntario aprobado puede tomar y entregar necesidades en cualquier caso. No necesitas ser tutor ni colaborador formal.',
            },
            {
              q: '¿Qué pasa si dos voluntarios entregan lo mismo?',
              a: 'El estado "En gestión" ayuda a prevenirlo: si alguien ya tomó una necesidad, los demás lo ven. Si aun así ocurre, la necesidad puede marcarse como entregada con una nota explicativa y el coordinador puede revisar el historial.',
            },
            {
              q: '¿El historial se puede ver?',
              a: 'Sí. Al final de cada ficha hay un historial de todos los cambios: quién registró el caso, quién tomó el seguimiento, qué necesidades se marcaron como entregadas y cuándo.',
            },
            {
              q: '¿Mis datos y los de los afectados son seguros?',
              a: 'Los datos personales (cédula, teléfono, dirección) solo son visibles para voluntarios aprobados dentro del sistema. El portal público de búsqueda solo muestra el nombre y el estado general, sin información privada.',
            },
            {
              q: '¿Cómo me aprueba el coordinador?',
              a: 'Después de registrarte, tu cuenta queda en estado "pendiente". Un coordinador recibirá la solicitud y te contactará por WhatsApp para verificar tu identidad. Solo entonces tendrás acceso completo.',
            },
          ].map(({ q, a }, i) => (
            <div key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <p className="font-semibold text-gray-800 text-sm mb-1">{q}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </Seccion>

      {/* Portal público CTA */}
      <div className="rounded-xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #0C4A6E 0%, #0891B2 100%)' }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
            <Search className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">¿Buscas a alguien?</h3>
            <p className="text-cyan-200 text-sm mb-4">
              El portal público permite a familiares buscar si sus seres queridos han sido registrados en Coro Presente,
              sin necesidad de ser voluntario ni tener cuenta.
            </p>
            <Link
              href="/buscar"
              className="inline-flex items-center gap-2 bg-[#EA580C] hover:bg-orange-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition btn-press"
            >
              Ir al portal de búsqueda <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
