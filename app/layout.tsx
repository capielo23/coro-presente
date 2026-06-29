import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CoroAyuda — Coro presente. Falcón solidario.',
  description: 'Sistema humanitario para familias afectadas por el terremoto. Ciudad de Coro, Estado Falcón, Venezuela.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
