import type { Metadata } from 'next'
import './globals.css'
import { ModalRoot } from '@/components/shared/ModalRoot'
import { AuthGuard } from '@/components/auth/AuthGuard'

export const metadata: Metadata = {
  title: 'AI Office',
  description: 'Requirements Pipeline Tool',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthGuard>
          {children}
          <ModalRoot />
        </AuthGuard>
      </body>
    </html>
  )
}
