import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GazelleGo — Биржа грузоперевозок',
  description: 'Соединяем клиентов с водителями газелей по всему Казахстану и СНГ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  )
}
