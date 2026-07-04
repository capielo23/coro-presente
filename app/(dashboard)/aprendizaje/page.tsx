import React from 'react'
import Link from 'next/link'
import {
  Home, Users, UserCheck, Settings, PlusCircle, ClipboardList,
  Check, X, HelpCircle, Search, ChevronRight, ArrowRight,
  KeyRound, UserPlus, ShieldCheck, AlertTriangle, UserCog, MessageCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

function Seccion({ numero, titulo, Icon, children, coordinador }: {
  numero: number | string; titulo: string; Icon: React.ElementType; children: React.ReactNode; coordinador?: boolean
}) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 ${coordinador ? 'border-cyan-200' : 'border-[var(--color-border)]'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm ${coordinador ? 'bg-cyan-600' : 'bg-[#0891B2]'}`}>
          {numero}
        </div>
        <div>
          {coordinador && (
            <p className="text-xs text-cyan-600 uppercase tracking-wide font-semibold mb-0.5">Solo coordinadores</p>
          )}
          <h3 className="font-bold text-gray-900 text-base leading-tight">{titulo}</h3>
        </div>
        <div className="ml-auto">
          <Icon className={`w-5 h-5 ${coordinador ? 'text-cyan-400' : 'text-gray-300'}`} />
        </div>
      </div>
      {children}
    </div>
  )
}

function Paso({ texto }: { texto: string }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#0891B2] mt-2" />
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

export default async function AprendizajePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let esCoordinador = false
  if (user) {
    const { data: perfil } = await supabase.from('voluntarios').select('rol').eq('id', user.id).single()
    esCoordinador = ['admin', 'coordinador'].includes(perfil?.rol ?? '')
  }

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
      <Seccion numero={1} titulo="¿Qué es Coro Presente?" Icon={Home}>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          Coro Presente es una herramienta para organizar la ayuda humanitaria a personas afectadas por el terremoto
          en Coro, Falcón. Permite registrar casos, hacer seguimiento de necesidades y coordinar entre voluntarios — todo desde el teléfono.
        </p>
        <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3 text-sm text-[var(--color-foreground)]">
          <strong>Principio fundamental:</strong> La información que registras en esta plataforma es
          confidencial. Nunca compartas datos personales de los afectados fuera del sistema.
        </div>
      </Seccion>

      {/* Sección 2 */}
      <Seccion numero={2} titulo="¿Cómo funcionan los roles?" Icon={Users}>
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
      <Seccion numero={3} titulo="Cómo registrar un caso" Icon={PlusCircle}>
        <div className="space-y-3 mb-4">
          <Paso texto="Ve a 'Nuevo registro' en el menú lateral." />
          <Paso texto="Selecciona si es una persona individual o un grupo familiar." />
          <Paso texto="Completa los datos de origen: ciudad y barrio donde vivían antes del terremoto." />
          <Paso texto="Indica dónde están alojados actualmente en Coro: tipo de alojamiento, sector y dirección." />
          <Paso texto="Agrega los datos de cada integrante. Solo Nombre y Apellido son obligatorios. La cédula ayuda a evitar registros duplicados." />
          <Paso texto="Al final, el sistema te pregunta si quieres tomar el seguimiento del caso o dejarlo disponible para otro voluntario." />
          <Paso texto="Haz clic en 'Registrar caso'. Serás redirigido a la ficha del caso donde puedes agregar necesidades." />
        </div>
        <div className="bg-[var(--color-muted)] rounded-xl p-3 text-xs text-gray-500 border border-[var(--color-border)]">
          Si intentas registrar a alguien con una cédula que ya está en el sistema, recibirás una alerta
          para evitar duplicados. Revisa el registro existente antes de crear uno nuevo.
        </div>
      </Seccion>

      {/* Sección 4 */}
      <Seccion numero={4} titulo="Cómo gestionar las necesidades" Icon={ClipboardList}>
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
          <Paso texto="Abre la ficha del caso y busca la sección 'Necesidades'." />
          <Paso texto="Haz clic en 'Agregar necesidad' para registrar lo que la persona necesita. Puedes describir varios artículos separados por comas: 'pantalón talla 30, franela M, calzado 38'." />
          <Paso texto="Cuando vayas a gestionar una necesidad, haz clic en 'Tomar en gestión'. Esto avisa a los demás que ya alguien está trabajando en eso, evitando duplicar esfuerzos." />
          <Paso texto="Al marcar como entregado, si la descripción tiene varios artículos, el sistema te muestra una lista de verificación. Marca solo lo que realmente se entregó." />
          <Paso texto="Si solo entregaste parte de los artículos, el estado queda como 'Parcial' con el conteo visible (ej: 2/5). Puedes actualizarlo más adelante." />
        </div>
      </Seccion>

      {/* Sección 5 */}
      <Seccion numero={5} titulo="Trabajo en equipo sin conflictos" Icon={Users}>
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

      {/* ── SECCIÓN COORDINADORES — solo visible para coordinadores/admin ── */}
      {esCoordinador && (
        <>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 rounded-full text-xs font-semibold text-white">
              <ShieldCheck className="w-3.5 h-3.5" /> Guía para coordinadores
            </span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Las siguientes guías son acciones que <strong>solo los coordinadores</strong> pueden realizar.
              Si un voluntario necesita alguna de estas acciones, debe contactarte por WhatsApp.
            </p>
          </div>

          {/* Coord A: Aprobar / rechazar voluntarios */}
          <Seccion numero="A" titulo="Aprobar o rechazar voluntarios" Icon={UserCheck} coordinador>
            <p className="text-sm text-gray-600 mb-4">
              Cuando alguien se registra, su cuenta queda en estado <strong>Pendiente</strong> hasta que un coordinador la revise.
              Las solicitudes nuevas aparecen con un punto rojo en el menú <em>Gestión de voluntarios</em>.
            </p>
            <div className="space-y-3 mb-4">
              <Paso texto="Ve al menú lateral → 'Gestión de voluntarios'." />
              <Paso texto="Las cuentas pendientes aparecen al tope con fondo amarillo. Haz clic en la fila para ver los datos." />
              <Paso texto="Usa el botón verde ✓ para aprobar. El voluntario podrá entrar al sistema de inmediato." />
              <Paso texto="Si el voluntario no puede verificarse, usa el botón rojo ✗ para rechazar. Su acceso quedará bloqueado." />
              <Paso texto="Puedes promover a alguien a coordinador desde el mismo panel usando el botón 'Hacer coordinador'." />
            </div>
            <div className="bg-[var(--color-muted)] border border-[var(--color-border)] rounded-xl p-3 text-xs text-gray-500">
              <strong>Nota:</strong> Revocar el acceso no elimina la cuenta ni los datos que ese voluntario haya registrado.
              Solo le impide entrar al sistema. Si fue un error, puedes volver a aprobarla.
            </div>
          </Seccion>

          {/* Coord B: Restablecer contraseña */}
          <Seccion numero="B" titulo="Restablecer contraseña de un voluntario" Icon={KeyRound} coordinador>
            <p className="text-sm text-gray-600 mb-4">
              Cuando un voluntario olvidó su contraseña y el correo no llega (límite de 2 correos/hora),
              puedes generarle una <strong>clave temporal</strong> y enviársela por WhatsApp.
            </p>
            <div className="space-y-3 mb-4">
              <Paso texto="Ve a 'Gestión de voluntarios' y busca al voluntario." />
              <Paso texto="Haz clic en el ícono de llave (🔑) en la fila del voluntario." />
              <Paso texto="El sistema genera una clave temporal automáticamente y la muestra en pantalla." />
              <Paso texto="Copia la clave con el botón copiar y envíasela al voluntario por WhatsApp." />
              <Paso texto="El voluntario entra con esa clave temporal. El sistema lo redirige automáticamente a crear su propia contraseña antes de acceder al dashboard." />
              <Paso texto="Una vez que el voluntario establece su nueva contraseña, la clave temporal queda inválida." />
            </div>
            <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3 flex items-start gap-2">
              <MessageCircle className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
              <p className="text-sm text-cyan-800">
                <strong>Mensaje sugerido para WhatsApp:</strong><br />
                <span className="italic">&ldquo;Hola [nombre], aquí tu clave temporal para Coro Presente: <strong>[clave]</strong>. Entra con ella en coropresente.vercel.app/login — el sistema te pedirá crear tu contraseña propia de inmediato.&rdquo;</span>
              </p>
            </div>
          </Seccion>

          {/* Coord C: Agregar integrantes a un caso */}
          <Seccion numero="C" titulo="Agregar integrantes a un caso existente" Icon={UserPlus} coordinador>
            <p className="text-sm text-gray-600 mb-4">
              Si al registrar un caso faltó un miembro del grupo familiar, o si una persona se une al núcleo después,
              puedes agregarla sin necesidad de crear un caso nuevo.
            </p>
            <div className="space-y-3 mb-4">
              <Paso texto="Abre la ficha del caso (Casos → nombre del caso)." />
              <Paso texto="Ve a la sección 'Integrantes' y haz clic en '+ Agregar integrante'." />
              <Paso texto="Completa los datos: nombre, apellido (obligatorios), cédula, fecha de nacimiento y condición especial si aplica." />
              <Paso texto="Haz clic en 'Guardar'. El integrante aparecerá en la lista y el contador del caso se actualizará." />
            </div>
            <div className="bg-[var(--color-muted)] border border-[var(--color-border)] rounded-xl p-3 text-xs text-gray-500">
              El sistema verifica que la cédula no esté ya registrada en otro caso. Si hay duplicado, recibirás una alerta
              para revisar el registro existente.
            </div>
          </Seccion>

          {/* Coord D: Asignar colaboradores */}
          <Seccion numero="D" titulo="Asignar colaboradores a un caso" Icon={UserCog} coordinador>
            <p className="text-sm text-gray-600 mb-4">
              Los colaboradores son voluntarios asignados formalmente a un caso para que puedan hacer
              seguimiento conjunto con el tutor. Solo los coordinadores pueden asignar colaboradores.
            </p>
            <div className="space-y-3 mb-4">
              <Paso texto="Abre la ficha del caso." />
              <Paso texto="En la sección 'Equipo del caso', haz clic en 'Gestionar colaboradores'." />
              <Paso texto="Busca al voluntario por nombre en el selector y selecciónalo." />
              <Paso texto="El voluntario quedará listado como colaborador. Recibirá acceso a la ficha del caso." />
              <Paso texto="Para remover un colaborador, haz clic en la X junto a su nombre en la lista." />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              <strong>Diferencia colaborador vs. tutor:</strong> El tutor es el responsable principal del caso y puede cerrarlo.
              Los colaboradores apoyan pero no pueden cerrar el caso. Un caso puede tener varios colaboradores pero solo un tutor.
            </div>
          </Seccion>
        </>
      )}

      {/* Sección 6 */}
      <Seccion numero={6} titulo="Preguntas frecuentes" Icon={HelpCircle}>
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
            {
              q: '¿Puedo editar los datos de un integrante después de registrarlo?',
              a: 'Sí, pero solo coordinadores pueden editar datos de personas (nombre, cédula, fecha de nacimiento, condición especial). Si eres voluntario y necesitas corregir un dato, comunícaselo a tu coordinador.',
            },
            {
              q: '¿Qué diferencia hay entre "revocar" y "eliminar" una cuenta de voluntario?',
              a: '"Revocar" bloquea el acceso al sistema pero mantiene todos los registros e historial que esa persona generó. No existe "eliminar cuenta" en el sistema para preservar la trazabilidad del trabajo realizado.',
            },
            {
              q: '¿Qué pasa si un voluntario no recibió el correo de restablecimiento de contraseña?',
              a: 'El sistema tiene un límite de 2 correos por hora. Si el correo no llegó, el coordinador puede generar una clave temporal desde "Gestión de voluntarios" y enviársela por WhatsApp. El voluntario entra con esa clave y el sistema lo obliga a crear una contraseña propia antes de acceder.',
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
