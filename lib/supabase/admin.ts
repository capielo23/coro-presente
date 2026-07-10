import { createClient } from '@supabase/supabase-js'

// Cliente con service_role — SOLO para operaciones de servidor privilegiadas
// NUNCA importar en componentes cliente
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      // Next.js cachea por defecto los GET de fetch en server components (Data
      // Cache), lo que servía listas viejas tras borrar/crear. Los datos se leen
      // siempre frescos; el caché intencional se maneja aparte con unstable_cache.
      global: {
        fetch: (url: RequestInfo | URL, options?: RequestInit) =>
          fetch(url, { ...options, cache: 'no-store' }),
      },
    }
  )
}
