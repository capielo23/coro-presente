# Cómo colaborar en Coro Presente 🏠

Gracias por sumarte a **Coro Presente**. Este proyecto conecta a personas que
necesitan ayuda con personas dispuestas a darla. El código maneja **datos
sensibles de gente vulnerable** (refugiados, casos, donativos). Por eso
trabajamos ordenados: cuidar el código es cuidar a esas personas.

Este documento explica **cómo trabajamos aquí**. Es corto a propósito. Léelo una
vez y síguelo siempre.

---

## 1. Las reglas de oro (aplican a TODAS las personas, sin excepción)

Estas reglas valen para todo el mundo: colaboradores nuevos, colaboradores de
confianza **y la fundadora (@capielo23)**. Nadie está por encima del proceso.
Que la fundadora también las cumpla es lo que las hace justas.

1. **Nadie sube cambios directo a `main`.** Ni la fundadora. Todo cambio entra
   por un **Pull Request** que alguien revisa. `main` es la versión oficial que
   siempre debe funcionar.

2. **Cada tarea vive primero como un Issue.** Si vas a trabajar en algo, ese
   "algo" tiene que existir como Issue. Si no existe, créalo antes de empezar.

3. **Reclama antes de trabajar.** Asígnate el Issue (Assignees → tu nombre)
   ANTES de tocar código. **Si un Issue ya tiene una persona asignada, no lo
   tomes.** Así evitamos que dos personas trabajen lo mismo.

4. **Una tarea = una rama = un Pull Request pequeño.** No mezcles cosas
   distintas en una sola rama. Un PR pequeño se revisa rápido y casi nunca
   choca con el de otra persona.

5. **Ponte al día antes de empezar.** Actualiza `main` con lo último antes de
   crear tu rama. Trabajar sobre una versión vieja es la causa #1 de choques.

6. **Todo Pull Request lo revisa y aprueba @capielo23 antes de fusionarse.**
   No fusiones tu propio PR sin esa revisión.

7. **Nunca subas secretos ni datos reales de personas.** Contraseñas, llaves,
   archivos `.env`, ni listas reales de refugiados o donantes. Si tienes dudas
   sobre si algo es sensible, **pregunta antes de subirlo**.

8. **Las zonas delicadas se avisan.** Si tu cambio toca la **base de datos**, la
   **lógica de emparejamiento (matching)** o la **seguridad/permisos**, avísalo
   en el Issue o el PR para que se revise con más calma. Estas partes protegen a
   personas reales.

9. **Trátense bien.** Los comentarios en un PR son sobre el código, no sobre la
   persona. Agradecer y explicar el "por qué" es parte del trabajo.

---

## 2. Cómo tomar y entregar una tarea (paso a paso)

Este es el ciclo completo. Es el mismo para todas las personas.

1. **Elige un Issue** de la lista de tareas (pestaña *Issues*) y **asígnatelo**.
2. **Ponte al día:** cámbiate a la rama `main` y baja lo último.
3. **Crea una rama nueva** solo para esa tarea (ver nombres abajo).
4. **Haz el cambio**, enfocado únicamente en esa tarea.
5. **Guarda tu avance** (commit) con un mensaje claro de qué hiciste.
6. **Sube la rama** a GitHub y **abre un Pull Request** hacia `main`.
7. **En el PR, enlaza el Issue** escribiendo `Closes #número` en la descripción,
   para que el Issue se cierre solo al fusionar.
8. **Espera la revisión.** Si te piden ajustes, los haces en la misma rama.
9. Cuando @capielo23 aprueba, **se fusiona** y la tarea queda lista. ✅

---

## 3. Cómo nombrar tu rama

El nombre de la rama dice de un vistazo qué tipo de cambio es:

- `feat/...`  → algo nuevo. Ej: `feat/filtro-por-estado`
- `fix/...`   → arreglar un error. Ej: `fix/foto-perfil-no-carga`
- `docs/...`  → documentación o textos. Ej: `docs/instrucciones-registro`

Usa palabras cortas y en minúscula, separadas por guiones.

---

## 4. Qué NO hacemos (para que quede clarísimo)

Sin ambigüedades. Estas cosas no se hacen, nunca:

- ❌ Trabajar o subir cambios directo en `main`.
- ❌ Tomar un Issue que ya está asignado a otra persona.
- ❌ Mandar Pull Requests gigantes que mezclan muchos temas.
- ❌ Fusionar un PR sin que @capielo23 lo haya revisado.
- ❌ Subir contraseñas, llaves, archivos `.env`, o datos reales de personas.
- ❌ Reescribir el historial de otra persona o forzar cambios (force push) sobre
  `main`.

---

## 5. ¿Y si algo choca o se rompe?

Tranquilidad: **GitHub avisa antes de dañar nada.**

- Si tu cambio choca con otro, GitHub lo marca como *conflict* y **no deja
  fusionar** hasta resolverlo. Nadie puede "ensuciar" el código a escondidas.
- Todo cambio fusionado se puede deshacer con el botón **Revert**.
- Si te trabas con un conflicto o no entiendes un aviso, **pide ayuda en el
  Issue o el PR antes de forzar nada.**

---

## 6. En resumen

> **Un Issue → lo reclamas → una rama pequeña → un Pull Request → revisión →
> se fusiona.**

Ese ciclo, repetido por todas las personas por igual, es lo que mantiene a Coro
Presente ordenado y seguro por más manos que se sumen. Gracias por respetarlo. 🙌
