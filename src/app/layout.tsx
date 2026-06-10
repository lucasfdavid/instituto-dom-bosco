import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Instituto Dom Bosco',
  description: 'Psicologia e Aprendizagem — Método D1·D7·D30',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
