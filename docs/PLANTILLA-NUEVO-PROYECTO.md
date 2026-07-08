# Plantilla: cómo arrancar un proyecto nuevo con esta metodología

> Esta plantilla nació de las lecciones aprendidas construyendo Coro Presente.
> La idea: que el próximo proyecto tenga desde el **día cero** las protecciones
> que aquí hubo que agregar después.
>
> **Cómo usarla:** al empezar un proyecto nuevo, dile a Claude:
> *"Lee `docs/PLANTILLA-NUEVO-PROYECTO.md` del repo coro-presente y aplícala a
> este proyecto nuevo."* Claude debe ejecutar el checklist completo y adaptar
> el CLAUDE.md modelo al stack del proyecto nuevo ANTES de escribir la primera
> funcionalidad.

---

## Checklist del día cero (en este orden, antes de la primera funcionalidad)

1. **Carpeta correcta**: crear el proyecto FUERA de OneDrive/Dropbox (ej.
   `C:\dev\nombre-proyecto`). Las carpetas sincronizadas corrompen `node_modules`
   y hacen todo lento.
2. **Git desde el primer minuto**: `git init`, primer commit, repo en GitHub.
3. **Secretos protegidos antes de que existan**: `.gitignore` con `.env*` (menos
   `.env.example`) desde el commit inicial. Crear `.env.example` con los nombres
   de las variables sin valores.
4. **`CLAUDE.md` adaptado** (ver modelo abajo): es el archivo que cualquier
   sesión de Claude carga automáticamente. Se escribe ANTES del primer código.
5. **CI desde el primer PR**: copiar `.github/workflows/ci.yml` de este repo y
   adaptar los comandos (tipos, lint, build, tests). Un verificador que existe
   desde el inicio nunca "estorba"; uno que se agrega tarde encuentra deudas.
6. **Protección de `main` en GitHub**: Settings → Branches → exigir PR y
   revisión. Nadie (ni tú) sube directo a `main`.
7. **`CONTRIBUTING.md`**: copiar el de este repo (reglas para humanos) y ajustar
   nombres.
8. **Convención de migraciones** (si hay base de datos): carpeta
   `supabase/migrations/` (o equivalente), numeración consecutiva `NNN_`,
   idempotentes, nunca destructivas.
9. **Decidir el modelo de permisos por escrito** antes de la primera tabla:
   qué roles existen, quién ve qué, quién edita qué. En Coro Presente los
   permisos se decidieron sobre la marcha y costó auditorías enteras alinearlos.
10. **Definir qué datos son sensibles** y cuáles pueden aparecer en pantallas
    públicas. Escribirlo en el CLAUDE.md como lista explícita.

## Lecciones de Coro Presente que la plantilla previene

| Error original | Prevención en el proyecto nuevo |
|---|---|
| Proyecto en OneDrive: lentitud extrema, hubo que mudarlo | Paso 1: nace en `C:\dev` |
| Seguridad por convención (cada ruta debe acordarse de validar) | CLAUDE.md Ley 2 desde día cero + revisar en cada PR |
| Rate limit en memoria que no sirve en serverless | Ley 3 conocida antes de escribir la primera ruta |
| Migraciones con números duplicados | Convención escrita antes de la migración 001 |
| Validación de datos agregada tarde (5 de 20 rutas) | Zod (o equivalente) obligatorio desde la primera ruta |
| CI agregado cuando ya había deudas | CI en el primer PR |
| Bugs por borrar/actualizar por texto en vez de por ID | Ley explícita desde el inicio |

## Metodología de trabajo diaria (la misma de este repo)

1. Toda tarea nace como **Issue** en GitHub.
2. **Protocolo de propuesta**: antes de codificar, Claude responde qué entendió,
   qué ya existe, qué propone, qué rompería y qué no conviene. El coordinador
   decide con esa información.
3. Una tarea = una rama = un PR pequeño.
4. **Loop de verificación** antes de entregar: tipos → lint → build → prueba
   funcional real en el navegador → corregir → repetir hasta verde.
5. El CI repite tipos/lint/build en GitHub: si el PR está en rojo, no se fusiona.
6. Revisión y fusión por el coordinador. `main` siempre funciona.

## Modelo de CLAUDE.md para el proyecto nuevo

Copiar el `CLAUDE.md` de este repo y adaptar estas secciones al proyecto nuevo:

- **Qué es este proyecto**: propósito, stack, qué datos maneja y cuáles son
  sensibles (Ley Cero). Ubicación real del código y URL del repo.
- **Ley 1 (analizar antes de tocar código)**: se copia igual — es universal.
- **Ley 2 (seguridad)**: adaptar al mecanismo de auth del proyecto nuevo. La
  pregunta guía: *¿cuál es la única barrera real de seguridad y qué debe hacer
  cada ruta/página nueva para mantenerla?* Escribir el patrón exacto a copiar.
- **Ley 3 (escalabilidad)**: adaptar a dónde corre (serverless, VPS, etc.).
  Las prohibiciones de estado en memoria y queries sin límite suelen aplicar.
- **Ley 4 (base de datos)**: igual salvo nombres de carpetas.
- **Ley 5 (reutilizar antes de crear)**: actualizar el mapa de carpetas (dónde
  vive la UI, las utilidades, los tipos, los clientes de servicios).
- **Ley 6 (loop de verificación)**: adaptar los comandos a los del proyecto.
- **Ley 7 (qué nunca se hace)**: se copia igual.
- **Deudas conocidas**: empieza vacía. Cada atajo consciente se anota ahí.
