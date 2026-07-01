# Handoff: Logo "Coro Presente" — sistema de marca final

## Overview
Identidad visual (logotipo / lockup) para **Coro Presente**, una plataforma web de gestión humanitaria para familias afectadas en el estado Falcón, Venezuela. El logo combina un **símbolo** (una familia de tres personas bajo un techo) con el **wordmark** "Coro Presente" y el lema **"Juntos nos levantamos"**. La paleta está basada en la bandera de Venezuela (azul, amarillo, rojo).

Este documento es **autosuficiente**: contiene el SVG exacto, los colores, las tipografías y las medidas. No necesitas abrir el HTML para implementarlo, aunque se incluye como referencia visual.

## About the Design Files
Los archivos son **referencias de diseño en HTML** — un prototipo de la apariencia prevista, **no código de producción para copiar tal cual**. La tarea es **recrear el logo en el entorno del proyecto** (React, Vue, Next, SvelteKit, etc.) siguiendo sus patrones. El símbolo es SVG inline, directamente portable: extráelo a un componente reutilizable (p. ej. `<Logo />`) y sírvelo como SVG, nunca como imagen rasterizada.

## Fidelity
**Alta fidelidad.** Colores, tipografía y proporciones son finales. Recrea cada versión con los valores exactos.

---

## Componente recomendado

Crea un único componente `<Logo />` con props que cubran todas las versiones:

```
<Logo
  variant="horizontal" | "stacked" | "mark"   // por defecto: "horizontal"
  theme="light" | "dark"                        // por defecto: "light"
  showTagline={true|false}                      // por defecto: false en header, true en hero
  size={number}                                 // alto del símbolo en px
/>
```

Reglas de color según `theme`:
- **light**: "Coro" `#0B47A1`, "Presente" `#D23A2E`; personas exteriores `#0B47A1`, central `#D23A2E`.
- **dark**: "Coro" `#FFFFFF`, "Presente" `#F0907F`; personas exteriores `#3F6FC4`, central `#E8554A`.
- El techo amarillo `#F4C033` es igual en ambos temas.

---

## El símbolo (icono "familia bajo techo")
Tres figuras (círculo = cabeza, rectángulo redondeado = cuerpo) bajo un techo en "∧". Las dos exteriores son azules; la central, más pequeña, es roja. El techo es una línea amarilla gruesa de extremos redondeados.

### SVG canónico — tema claro
```html
<svg viewBox="0 0 100 100" aria-hidden="true">
  <!-- techo -->
  <path d="M14,46 L50,20 L86,46" fill="none" stroke="#F4C033" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- persona izquierda -->
  <circle cx="36" cy="58" r="7" fill="#0B47A1"/>
  <rect x="29" y="66" width="14" height="20" rx="7" fill="#0B47A1"/>
  <!-- persona derecha -->
  <circle cx="64" cy="58" r="7" fill="#0B47A1"/>
  <rect x="57" y="66" width="14" height="20" rx="7" fill="#0B47A1"/>
  <!-- persona central (destacada) -->
  <circle cx="50" cy="63" r="6" fill="#D23A2E"/>
  <rect x="44" y="70" width="12" height="16" rx="6" fill="#D23A2E"/>
</svg>
```

### SVG canónico — tema oscuro
Idéntico, pero: azules `#0B47A1` → `#3F6FC4`, rojo `#D23A2E` → `#E8554A`, amarillo igual.

### Cuando el símbolo va solo (sin texto)
Añade `role="img"` y `aria-label="Coro Presente"` en lugar de `aria-hidden`.

### Versión favicon pequeña (≤32 px)
Engrosa los trazos para legibilidad: `stroke-width="11"`, cabezas `r="8"`, cuerpos `width="16"` (exteriores `x="28"/"56"`), central cabeza `r="7"` `cy="62"`, cuerpo `width="14" x="43" y="69" height="17"`. Colócalo centrado sobre un cuadrado `#0E1B33` con esquinas redondeadas (radio ~25% del lado).

---

## Wordmark
- Texto: **"Coro Presente"** (dos palabras, espacio normal).
- Tipografía: **Plus Jakarta Sans**, peso **800 (ExtraBold)**.
- `letter-spacing: -0.025em` en hero, `-0.02em` en tamaños pequeños; `line-height: 0.98–1`.
- Colores: ver reglas de `theme` arriba.

## Lema / tagline
- Texto: **"Juntos nos levantamos"**.
- Tipografía: Plus Jakarta Sans, peso **600**, `text-transform: uppercase`.
- Color: `#8A8475`. `letter-spacing` ~`0.18–0.22em` (más amplio cuanto más grande el lockup).
- Va debajo del wordmark, alineado a su borde izquierdo (horizontal) o centrado (apilado).
- Por defecto **oculto en el header** de la web; visible en el lockup hero y en la versión apilada.

---

## Variantes (layouts)

### `horizontal` (recomendado para header)
Símbolo a la izquierda + wordmark a la derecha (tagline opcional debajo del wordmark). `display:flex; align-items:center; gap` escala con el tamaño (≈9 px en header, ≈34 px en hero).

### `stacked` (apilado)
Símbolo arriba centrado, wordmark + tagline debajo. `flex-direction:column; align-items:center; gap:~12px`. Para footer, tarjetas, splash.

### `mark` (símbolo solo)
Solo el SVG, para avatar, sello o favicon.

---

## Medidas de referencia
- **Header web:** símbolo 30 px · wordmark 17 px · sin tagline.
- **Hero (inicio):** símbolo 120 px · wordmark 54 px · tagline 12 px · gap 36 px.
- **Favicon:** 64 px y 32 px (usar la versión de trazos engrosados, tema oscuro sobre cuadrado `#0E1B33`).

---

## Design Tokens

Colores:
- `--brand-blue: #0B47A1`   (primario · "Coro" · personas)
- `--brand-blue-light: #3F6FC4`  (sobre fondo oscuro)
- `--brand-yellow: #F4C033`  (techo · acento · botón "Registrar")
- `--brand-red: #D23A2E`   (acento · "Presente" · persona central)
- `--brand-red-light: #E8554A`  (sobre fondo oscuro)
- `--ink: #16223A`      (texto principal)
- `--muted: #8A8475`     (lema / subtítulos)
- `--bg-warm: #FAF7F1`    (fondo claro)
- `--bg-dark: #0E1B33`    (fondo oscuro / favicon)

Tipografía:
- **Plus Jakarta Sans** (Google Fonts). Pesos: 600, 800.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;800&display=swap" rel="stylesheet">
```

---

## Accesibilidad
- Junto al wordmark, el `<svg>` es decorativo: `aria-hidden="true"`; el texto "Coro Presente" se lee.
- Como símbolo solo: `role="img"` + `aria-label="Coro Presente"`.
- Contraste: wordmark azul/rojo sobre claro y la variante clara sobre oscuro cumplen contraste para texto grande.

---

## Assets
El logo dentro del UI es 100% SVG inline + fuente web. Además, en `assets/` ya tienes los archivos exportados y listos para usar:

- `assets/symbol-light.svg` — símbolo, tema claro (transparente). **Fuente de verdad** para el componente.
- `assets/symbol-dark.svg` — símbolo, tema oscuro (transparente).
- `assets/app-icon.svg` — símbolo (tema oscuro, trazo engrosado) sobre cuadrado redondeado `#0E1B33`.
- `assets/favicon-16.png`, `-32.png`, `-64.png`, `-180.png`, `-512.png` — íconos de app rasterizados (cuadrado oscuro). El de **180 px** sirve como `apple-touch-icon`; el de **512 px** para el manifest PWA.
- `assets/symbol-light-512.png` — símbolo transparente en grande, por si necesitas un PNG.

Snippet para el `<head>`:
```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180.png">
```

Para un `.ico` multitamaño, combina los PNG de 16/32/64 px con cualquier conversor; los PNG ya están listos.

## Files
- `Logo FalconAyuda.dc.html` — prototipo con todas las exploraciones. La sección final relevante es la **tanda 3 ("Coro Presente — sistema de marca")**, id `#3a` en el archivo: lockup hero, símbolo solo, apilado, favicons (64/32 px) y headers claro/oscuro. (Las tandas 1 y 2 son exploraciones previas, conservadas como historial.)
