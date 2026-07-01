# Coro Presente

Sistema de gestión de ayuda humanitaria para personas afectadas por desastres naturales en el estado Falcón, Venezuela.

Permite registrar casos, coordinar voluntarios, hacer seguimiento de entregas y publicar datos de transparencia sin exponer información personal.

**Producción:** https://coropresente.com

---

## Para colaboradores nuevos

### Qué necesitas instalar

- [Node.js 18+](https://nodejs.org)
- [Git](https://git-scm.com)
- Un editor de código (VS Code recomendado)

### Primeros pasos

```bash
git clone https://github.com/capielo23/coro-presente.git
cd coro-presente
npm install
```

Crea el archivo `.env.local` en la raíz del proyecto con las credenciales que te dará el administrador (`capielo23@gmail.com`). El archivo `.env.example` muestra qué variables necesitas.

```bash
npm run dev
```

Abre http://localhost:3000

### Variables de entorno necesarias

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_NAME=Coro Presente
NEXT_PUBLIC_APP_URL=https://coropresente.com
SUPABASE_STORAGE_BUCKET=fotos-personas
```

Pídele los valores al administrador. **Nunca subas `.env.local` a GitHub** — ya está en `.gitignore`.

---

## Estructura del proyecto

```
app/
  (auth)/          — Login, registro, recuperar contraseña
  (dashboard)/     — Dashboard, casos, perfil, admin
  api/             — API routes (casos, necesidades, seguimientos, etc.)
  buscar/          — Portal público de búsqueda (sin login)
  transparencia/   — Portal de transparencia pública (sin login)
components/
  casos/           — Componentes de ficha y gestión de casos
  admin/           — Panel de aprobación de voluntarios
  ui/              — Componentes reutilizables
lib/
  supabase/        — Clientes de Supabase (server, client, admin)
  types.ts         — Tipos TypeScript del dominio
  matching.ts      — Algoritmo de matching voluntario <-> caso
supabase/
  migrations/      — Migraciones SQL aplicadas en orden
```

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Estilos | Tailwind CSS |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth |
| Storage (fotos) | Supabase Storage |
| Deploy | Vercel |

---

## Roles en el sistema

| Rol | Puede hacer |
|-----|-------------|
| **Admin** | Todo: aprobar coordinadores, ver estadísticas, gestionar usuarios |
| **Coordinador** | Registrar y aprobar voluntarios, gestionar casos |
| **Voluntario** | Ver y tomar casos, registrar seguimientos y entregas |

El registro público crea voluntarios en estado `pendiente`. Un coordinador o admin los aprueba desde `/admin/voluntarios`.

---

## Reglas de seguridad (no negociables)

- `.env.local` **nunca** va a GitHub
- `SUPABASE_SERVICE_ROLE_KEY` **nunca** en código del cliente (solo en API routes del servidor)
- El portal público (`/buscar`, `/transparencia`) **nunca** expone: dirección exacta, teléfono, cédula ni datos médicos
- Las fotos usan URLs firmadas que expiran — no son indexables

---

## Comandos útiles

```bash
npm run dev       # Servidor de desarrollo en localhost:3000
npm run build     # Build de producción (verifica errores antes de hacer push)
npm run lint      # Revisión de código
```

---

## Contacto

Administrador del proyecto: **capielo23@gmail.com**
