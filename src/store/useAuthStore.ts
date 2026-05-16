'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAppStore } from './useAppStore'
import type { User } from '@/types'

const SEED_USERS = [
  { username: 'admin',    password: 'demo1234', role: 'Admin'     as const, displayName: 'Admin User', projectName: 'AI Office Demo' },
  { username: 'qa_lead',  password: 'test5678', role: 'QA'        as const, displayName: 'QA Lead',    projectName: 'AI Office Demo' },
  { username: 'dev_lead', password: 'dev9999',  role: 'Developer' as const, displayName: 'Dev Lead',   projectName: 'AI Office Demo' },
]

interface AuthState {
  currentUser: User | null
  error:       string | null
  login:       (username: string, password: string) => boolean
  logout:      () => void
  register:    (username: string, password: string, displayName: string) => boolean
  clearError:  () => void
}

// In-memory user list — not persisted (only the session is persisted)
let runtimeUsers = [...SEED_USERS]

function switchUserStore(username: string) {
  const key = `ai-office-store-${username}`
  useAppStore.persist.setOptions({ name: key })
  useAppStore.persist.rehydrate()
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      error:       null,

      login: (username, password) => {
        const user = runtimeUsers.find(
          u => u.username === username && u.password === password
        )
        if (user) {
          set({
            currentUser: {
              username:    user.username,
              role:        user.role,
              displayName: user.displayName,
              projectName: user.projectName,
            },
            error: null,
          })
          switchUserStore(user.username)
          return true
        }
        set({ error: 'Invalid username or password' })
        return false
      },

      logout: () => {
        // Clear app store so next user starts fresh
        useAppStore.getState().resetStore()
        useAppStore.persist.setOptions({ name: 'ai-office-store-guest' })
        set({ currentUser: null, error: null })
      },

      register: (username, password, displayName) => {
        if (runtimeUsers.find(u => u.username === username)) {
          set({ error: 'Username already exists' })
          return false
        }
        if (password.length < 6) {
          set({ error: 'Password must be at least 6 characters' })
          return false
        }
        runtimeUsers = [...runtimeUsers, {
          username,
          password,
          role:        'Admin' as const,
          displayName: displayName || username,
          projectName: 'AI Office Demo',
        }]
        set({
          currentUser: {
            username,
            role:        'Admin',
            displayName: displayName || username,
            projectName: 'AI Office Demo',
          },
          error: null,
        })
        switchUserStore(username)
        return true
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'ai-office-auth' }
  )
)
