'use client'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { AuthScreen } from './AuthScreen'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const currentUser = useAuthStore(s => s.currentUser)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  if (!hydrated) return null
  if (!currentUser) return <AuthScreen />
  return <>{children}</>
}
