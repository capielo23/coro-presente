import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { ToastProvider } from '@/components/ui/ToastContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const poppins = Poppins({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-poppins' })

export const metadata: Metadata = {
  title: 'Coro Presente — Juntos nos levantamos',
  description: 'Sistema humanitario para familias afectadas por el terremoto. Ciudad de Coro, Estado Falcón, Venezuela.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} ${inter.variable} ${poppins.variable}`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
