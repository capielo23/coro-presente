# PENDIENTE — Modelo de privacidad de fotos (decisión de diseño)

> Creado: 2026-06-30
> Estado: **Pendiente de decidir** (no implementar hasta resolver)
> Prioridad: Antes de exponer fotos en el buscador público.

---

## Por qué existe este pendiente

Las fotos son el corazón del sistema: sirven para reconocer, ubicar y reunir a
personas con sus familiares. Pero una foto de rostro es un dato **muy sensible**
(permite identificar y localizar físicamente a alguien).

Hoy el buscador público (`app/api/buscar/route.ts`) **deliberadamente NO devuelve
fotos** — solo nombre, apellido y estado del caso. Esa decisión fue correcta.

Si en el futuro se quiere que los familiares encuentren a alguien **por foto**,
hay que extender el modelo de privacidad **de forma deliberada**, no como efecto
secundario del código.

---

## Qué hay que decidir

Un modelo de privacidad responde: **¿quién ve qué dato, bajo qué condición, con
qué consentimiento?** Cruzando tres ejes:

1. **Sensibilidad del dato** — la foto cae en "muy sensible".
2. **Quién mira** — público anónimo / voluntario aprobado / coordinador / admin.
3. **Consentimiento y propósito** — ¿autorizó la persona o su representante que
   su foto se muestre, y a quién?

### Riesgos a prevenir (contexto humanitario)
- Menores de edad en un buscador abierto e indexable por Google.
- Personas en riesgo (violencia, situación de calle) cuya ubicación no debe ser pública.
- Uso del buscador para **localizar** a una persona vulnerable en vez de reunirla.

---

## Opciones (de más abierto a más protegido)

1. **Foto pública abierta** — cualquiera busca y ve la foto. Máximo alcance,
   máximo riesgo. *No recomendado para dato muy sensible.*
2. **Confirmación sin foto** *(punto dulce sugerido)* — el buscador público dice
   "esta persona está registrada y a salvo" + contacto de coordinación. El familiar
   llama, se verifica su identidad, y un coordinador le confirma/muestra la foto.
3. **Foto bajo verificación** — la foto solo se revela tras un paso de verificación
   (código, contacto telefónico, etc.).
4. **Solo interno** — la foto nunca es pública; solo voluntarios/coordinadores la
   ven para el trabajo de reconocimiento. *(Es básicamente el estado actual.)*

---

## Pregunta que orienta todo

> Cuando un familiar busca a alguien, **¿qué debería ver exactamente — la foto, o
> una confirmación con contacto de coordinación?**

Responder eso define casi todo lo demás (qué devuelve la API pública, qué se
indexa, quién accede a la imagen).

---

## Tareas técnicas asociadas (cuando se decida)
- [ ] Definir consentimiento al registrar la foto (checkbox + texto legal).
- [ ] Si se exponen fotos: control de acceso por nivel de usuario.
- [ ] Evitar indexación pública (noindex / URLs firmadas no listables).
- [ ] Consideración especial para menores de edad.
