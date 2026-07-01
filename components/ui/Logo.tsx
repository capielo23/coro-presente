import type { CSSProperties } from 'react'

/**
 * Marca "Coro Presente".
 *
 * Símbolo: un techo (dorado) que cobija a un grupo de personas (azul y rojo)
 * — refugio + comunidad. Los colores son el tricolor de Venezuela
 * (amarillo, azul, rojo).
 *
 * El símbolo está pensado para verse sobre fondo claro (blanco o crema). En
 * superficies oscuras debe colocarse dentro de un mosaico claro (ver cada
 * pantalla), tal como en el manual de marca.
 */

// Paleta de marca
export const BRAND = {
  gold: '#F2B50E', // amarillo del techo (bandera de Venezuela)
  blue: '#1E40AF', // azul de "Coro" y de las personas
  red: '#DC2626',  // rojo de "Presente" y de las personas
  cream: '#FAF6EE',// fondo de mosaico claro
  navy: '#16233A', // fondo de favicon / mosaico oscuro
} as const

interface LogoProps {
  size?: number
  className?: string
  tone?: 'light' | 'dark'   // aceptado para compatibilidad; el SVG usa colores fijos de marca
}

/** Símbolo solo: techo + personas. Colores fijos de marca, sobre fondo claro. */
export default function Logo({ size = 24, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Coro Presente"
      className={className}
    >
      {/* Familia bajo el techo: dos adultos (azul) y un niño (rojo) en el centro */}
      {/* Adulto izquierdo */}
      <circle cx="11.5" cy="16.3" r="2.3" fill={BRAND.blue} />
      <rect x="8.9" y="18.1" width="5.2" height="7.8" rx="2.6" fill={BRAND.blue} />
      {/* Adulto derecho */}
      <circle cx="20.5" cy="16.3" r="2.3" fill={BRAND.blue} />
      <rect x="17.9" y="18.1" width="5.2" height="7.8" rx="2.6" fill={BRAND.blue} />
      {/* Niño (centro, más pequeño y al frente) */}
      <circle cx="16" cy="19.6" r="1.75" fill={BRAND.red} />
      <rect x="14.1" y="21.1" width="3.8" height="4.8" rx="1.9" fill={BRAND.red} />

      {/* Techo (dorado) que cobija a la familia */}
      <path
        d="M4.8 13.6L16 5.4L27.2 13.6"
        stroke={BRAND.gold}
        strokeWidth="3.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface WordmarkProps {
  className?: string
  /** color de la palabra "Coro" (por defecto azul de marca) */
  coroColor?: string
  /** color de la palabra "Presente" (por defecto rojo de marca) */
  presenteColor?: string
  style?: CSSProperties
}

/**
 * Logotipo tipográfico "Coro Presente" — fuente geométrica (Poppins) en dos
 * tonos. Pásale el tamaño/peso vía `className`; los colores se adaptan al
 * fondo con `coroColor` / `presenteColor`.
 */
export function Wordmark({
  className = '',
  coroColor = BRAND.blue,
  presenteColor = BRAND.red,
  style,
}: WordmarkProps) {
  return (
    <span
      className={`font-extrabold tracking-tight whitespace-nowrap ${className}`}
      style={{ fontFamily: 'var(--font-poppins), var(--font-inter), system-ui, sans-serif', ...style }}
    >
      <span style={{ color: coroColor }}>Coro</span>{' '}
      <span style={{ color: presenteColor }}>Presente</span>
    </span>
  )
}
