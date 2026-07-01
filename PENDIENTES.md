# CoroAyuda — Pendientes del coordinador

> Actualizado: 2026-06-30
> Todo lo de código ya está hecho. Solo estas acciones requieren tu intervención manual.

---

## 🔴 Crítico antes de lanzar

### 1. Activar URL de recuperación de contraseña en Supabase
Para que el flujo de "Olvidé mi contraseña" funcione end-to-end:

1. Entra a [supabase.com](https://supabase.com) → tu proyecto
2. Ve a **Authentication → URL Configuration**
3. En **Additional Redirect URLs**, agrega:
   ```
   http://localhost:3000/cambiar-contrasena
   https://TU-DOMINIO.vercel.app/cambiar-contrasena
   ```
4. Guarda.

Sin esto, el enlace del correo de recuperación redirige a una URL bloqueada.

---

### 2. Activar Connection Pooler de Supabase (resistencia a carga)
Sin esto, con 100+ usuarios simultáneos la base de datos se queda sin conexiones.

1. En Supabase → **Settings → Database → Connection Pooling**
2. Activa **Supavisor** en modo **Transaction**
3. Copia la URL que aparece (tiene puerto `6543`, no `5432`)
4. Agrégala a tu `.env.local` y a las variables de entorno en Vercel:
   ```env
   # Reemplaza la URL directa de DB por esta:
   DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

---

## 🟡 Importante después del lanzamiento

### 3. Ejecutar SQL pendiente en Supabase
Si aún no se ejecutó este SQL en el editor de Supabase:

```sql
CREATE TABLE IF NOT EXISTS caso_colaboradores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE NOT NULL,
  voluntario_id UUID REFERENCES voluntarios(id) NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(caso_id, voluntario_id)
);
```

---

### 4. Configurar servicio de email externo (notificaciones)
Para recibir un email cuando un nuevo voluntario se registra:

- Opción recomendada: **Resend** (resend.com) — gratis hasta 3,000 emails/mes
- Requiere: crear cuenta, verificar dominio o usar `onboarding@resend.dev` para pruebas
- Agregar a `.env.local`:
  ```env
  RESEND_API_KEY=re_xxxxxxxxxxxx
  ```
- Avisar para implementar el envío del email desde la API de registro.

---

### 5. Deploy en Vercel
Cuando estés listo para lanzar públicamente:

1. En [vercel.com](https://vercel.com) → importa el repo de GitHub
2. Configura estas variables de entorno en Vercel (las mismas de `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET`
3. Agrega el dominio de Vercel a las Redirect URLs de Supabase (punto 1 arriba).

---

## ✅ Ya hecho (referencia)

- Auth completo (login, registro, recuperación de contraseña, aprobación admin)
- CRUD de casos con fotos + lightbox
- Portal público de búsqueda con rate limiting
- Panel admin + estadísticas del operativo
- Paginación, búsqueda, badge de pendientes
- Formulario multi-paso (wizard 4 pasos)
- Rediseño UI: paleta Compassion Blue, iconos SVG Lucide, skeletons, micro-animaciones
- Caché de estadísticas globales (60s) para resistir carga concurrente
