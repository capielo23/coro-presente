# CLAUDE.md — Leyes de trabajo de Coro Presente

Este documento es **obligatorio y no negociable** para cualquier modelo o agente que
trabaje en este proyecto. No son sugerencias: son leyes. Si una instrucción del
usuario entra en conflicto con una ley, se le explica el conflicto ANTES de actuar.

## Qué es este proyecto

App de gestión de ayuda humanitaria (Coro, Estado Falcón, Venezuela): casos de
familias vulnerables, necesidades por persona, entregas, voluntarios con roles.
**Maneja datos reales de personas vulnerables** (refugiados, niños, condiciones
médicas, direcciones). Un error aquí no rompe "una app": expone o perjudica a
personas reales. Esa es la Ley Cero y de ella derivan todas las demás.

- **Stack:** Next.js 14 (App Router) + TypeScript + Tailwind + Supabase (Postgres, Auth, Storage) + Zod. Deploy en Vercel.
- **Ubicación real del código:** `C:\dev\coro-presente\coroayuda`. La carpeta en
  OneDrive (`Desktop\Ayuda Venezuela`) es un residuo viejo: NO trabajar ahí nunca.
- **Repo:** github.com/capielo23/coro-presente — `main` protegida, todo entra por PR.

---

## LEY 1 — Analizar antes de tocar código (protocolo de propuesta)

El usuario es el coordinador del proyecto, no un programador. **Nunca asumas que
lo que pide es técnicamente correcto, completo o la mejor opción.** Tu primera
respuesta a cualquier pedido de cambio tiene este formato obligatorio:

1. **Qué entendí** — reformula el pedido en una frase.
2. **Qué existe ya** — busca en el código ANTES de opinar (componentes, rutas,
   migraciones, utilidades). Si algo parecido existe, se reutiliza o extiende;
   jamás se duplica.
3. **Qué propongo** — la opción que conviene y por qué.
4. **Qué rompería o afectaría** — flujos, pantallas, datos o permisos que este
   cambio toca. Si toca base de datos, permisos o el buscador público, decláralo
   como **zona delicada** explícitamente.
5. **Qué NO conviene hacer** — si el pedido tal cual traería problemas, dilo
   claro y ofrece la alternativa. Complacer sin advertir es una falta grave.

Para cambios triviales (un texto, un color) los puntos 3–5 pueden ser una línea,
pero el hábito de verificar qué existe ya (punto 2) no se salta nunca.

## LEY 2 — Seguridad en cada ruta API (sin excepciones)

Contexto crítico de esta app: el `middleware.ts` **excluye `/api/`** de su
protección, y todas las rutas usan `createAdminClient()` (service_role), que
**ignora por completo las políticas RLS de la base de datos**. Por lo tanto la
única barrera de seguridad es el código de cada ruta. De ahí estas reglas:

- Toda ruta nueva en `app/api/` empieza con: (a) `supabase.auth.getUser()` y 401
  si no hay usuario; (b) consulta del voluntario y verificación de `estado ===
  'aprobado'` y del `rol` requerido, con 403 si no cumple. Copia el patrón de
  `verificarGestor()` en `app/api/admin/voluntarios/route.ts`.
- Excepciones públicas permitidas SOLO: `buscar` (público por diseño),
  `transparencia`, `sectores-coro`, `areas-ayuda`, y auth. Cualquier otra ruta
  pública nueva requiere justificación escrita en el PR.
- **Todo body/query se valida con Zod** (`safeParse`) antes de usarse. Nada de
  leer `body.campo` directo. Los IDs se validan como UUID.
- Endpoints públicos devuelven SOLO campos aprobados explícitamente (ver el
  mapeo de `app/api/buscar/route.ts`): nunca cédula, teléfono, dirección exacta,
  condición médica, ni fotos. Al agregar columnas nuevas a una tabla, revisa si
  algún endpoint público hace `select('*')` y podría filtrarlas.
- **Borrar o actualizar SIEMPRE por ID (UUID), jamás por coincidencia de texto.**
  (Bug histórico real: el ledger de entregas borraba filas equivocadas por
  matching de texto. No se repite.)
- Secretos: nunca en código, nunca en commits, nunca en logs. `SUPABASE_SERVICE_ROLE_KEY`
  solo se importa desde `lib/supabase/admin.ts` y solo en código de servidor.
- Autorización granular: "estar logueado" no basta. Pregunta siempre: ¿este rol
  puede hacer ESTA acción sobre ESTE caso? (tutor vs colaborador vs coordinador
  vs admin). Si la regla no está clara, pregunta al usuario antes de implementar.

## LEY 3 — Escalabilidad: la app corre en serverless (Vercel)

- **Prohibido estado en memoria del proceso** (Maps, variables globales mutables,
  caches caseros) para lógica de negocio, rate limiting o sesiones. Cada request
  puede caer en una instancia distinta y el estado se pierde o miente.
  (El rate limit actual de `buscar` en memoria es una deuda conocida; el
  reemplazo correcto es Upstash Redis o `@vercel/kv`.)
- Toda lista que crece (casos, personas, necesidades, voluntarios) se pagina en
  el servidor. Nunca `select` sin `limit` en tablas que crecen.
- Evita N+1: si necesitas datos de N filas relacionadas, usa un join/`in()` o un
  RPC, no un query por fila dentro de un loop.
- Estadísticas y agregados costosos van con caché (revalidación 60s ya es el
  patrón del dashboard) o RPC en Postgres, no calculados en JS trayendo tablas enteras.
- Fotos y archivos: siempre Supabase Storage, nunca base64 en la base de datos.

## LEY 4 — Base de datos y migraciones

- Toda alteración de esquema es un archivo nuevo en `supabase/migrations/` con el
  **siguiente número consecutivo libre** (revisa los existentes; ya hubo números
  duplicados 005/006/007 y eso no puede repetirse). Formato: `NNN_descripcion.sql`.
- Migraciones **idempotentes** (`IF NOT EXISTS`, `DROP POLICY IF EXISTS` + `CREATE`)
  y **no destructivas**: prohibido `DROP TABLE`, `DROP COLUMN` o `DELETE` masivo
  sin plan de migración de datos aprobado explícitamente por el usuario.
- Nunca modificar una migración ya aplicada en producción; se corrige con una nueva.
- Aunque las rutas usen service_role, toda tabla nueva lleva RLS habilitado y
  políticas básicas (defensa en profundidad; el patrón está en `001` y `003`).
- Cambios de esquema van en su propio PR (o claramente señalados), marcados como
  zona delicada, con el SQL exacto que el coordinador debe ejecutar en Supabase
  si no hay pipeline de migraciones automático.

## LEY 5 — Reutilizar antes de crear (contra el trabajo doble y disperso)

Antes de crear CUALQUIER componente, función o ruta, busca si ya existe:

- UI reutilizable vive en `components/ui/` (Toast, StatCard, CedulaInput,
  TelefonoInput, AvatarUpload, FotoLightbox…). Dominio de casos en
  `components/casos/`, dashboard en `components/dashboard/`.
- Utilidades en `lib/utils.ts`, tipos compartidos en `lib/types.ts`, clientes
  Supabase SOLO desde `lib/supabase/{client,server,admin}.ts` (jamás crear un
  cliente Supabase inline).
- Notificaciones al usuario: usar el ToastContext existente, no `alert()`.
- Idioma: código y UI en español, siguiendo el estilo existente (camelCase en
  TS, snake_case en columnas SQL).
- Si encuentras dos implementaciones de lo mismo, no agregues una tercera:
  avisa y propone unificar.
- Un cambio = una rama = un PR pequeño (ver CONTRIBUTING.md). No mezclar temas.

## LEY 6 — El loop de verificación (nada se entrega sin pasarlo)

Ningún trabajo se declara terminado por "debería funcionar". El ciclo es
**implementar → verificar → corregir → repetir** hasta que TODO pase limpio:

1. `npx tsc --noEmit` — cero errores de tipos.
2. `npm run lint` — cero errores.
3. `npm run build` — compila completo (atrapa errores de rutas/SSR que dev no muestra).
4. **Prueba funcional real**: levantar el dev server y ejercitar el flujo tocado
   (la pantalla carga, el formulario envía, el error se muestra, el dato persiste).
   Verificar consola del navegador y respuesta de red sin errores.
5. **Prueba de no-regresión mínima**: ejercitar también el flujo vecino más
   probable de romperse (ej.: si tocaste necesidades, revisa el detalle del caso
   y el desglose por integrante).
6. Si algo falla: se corrige la causa raíz (no se parchea el síntoma) y se
   vuelve al paso 1. Se repite el loop completo, no solo el paso que falló.

Al reportar, se dice la verdad literal: qué se verificó, qué pasó y qué quedó
sin verificar. "Listo" sin evidencia está prohibido.

### Definición de HECHO (checklist final antes de todo PR)

- [ ] tsc, lint y build en verde
- [ ] Flujo probado en navegador (con evidencia: qué se probó)
- [ ] Rutas nuevas con auth + rol + Zod
- [ ] Sin secretos, sin datos reales de personas en el diff
- [ ] Sin estado en memoria, sin queries sin límite
- [ ] Migración (si hay) numerada, idempotente, no destructiva, avisada
- [ ] Reutilizó lo existente; no dejó código duplicado ni archivos huérfanos
- [ ] PR pequeño, en rama propia, enlazando su Issue (`Closes #N`)

## LEY 7 — Qué NUNCA se hace

- ❌ Commit o push directo a `main`; force push; saltarse la revisión de @capielo23.
- ❌ Borrar datos, tablas o archivos de Storage sin confirmación explícita del usuario.
- ❌ Ejecutar SQL destructivo contra producción "para probar".
- ❌ Inventar que algo se probó o funciona sin haberlo verificado.
- ❌ Introducir dependencias nuevas sin justificar por qué lo existente no basta.
- ❌ Trabajar en la copia de OneDrive; el proyecto vive en `C:\dev\coro-presente\coroayuda`.
- ❌ Callarse un riesgo para no contradecir al usuario.

---

## Deudas conocidas (no repetir estos errores, y son candidatas a Issues)

- Rate limiting en memoria en `app/api/buscar/route.ts` (no sirve en serverless).
- Migraciones con números duplicados (005/006/007 x2) ya aplicadas: no renumerar,
  pero el próximo número es el consecutivo mayor.
- Validación Zod incompleta: solo ~5 de ~20 rutas la usan; toda ruta que se toque
  se deja con Zod al salir.
- El CI (`.github/workflows/ci.yml`) corre tipos/lint/build en cada PR, pero NO
  reemplaza la prueba funcional en navegador de la Ley 6: esa sigue siendo manual.
- Sin tests automatizados; los flujos críticos (necesidades/entregas/permisos)
  son los primeros candidatos cuando se agreguen.
