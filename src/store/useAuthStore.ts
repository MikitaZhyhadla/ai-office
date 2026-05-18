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
  users:       User[]
  error:       string | null
  login:       (username: string, password: string) => boolean
  logout:      () => void
  register:    (username: string, password: string, displayName: string, role?: User['role']) => boolean
  clearError:  () => void
}

type RuntimeUser = { username: string; password: string; role: User['role']; displayName: string; projectName: string }

// In-memory user list — not persisted (only the session is persisted)
let runtimeUsers: RuntimeUser[] = [...SEED_USERS]

function switchUserStore(username: string) {
  const key = `ai-office-store-${username}`
  useAppStore.persist.setOptions({ name: key })
  useAppStore.persist.rehydrate()
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      users: SEED_USERS.map(u => ({
        username:    u.username,
        role:        u.role,
        displayName: u.displayName,
        projectName: u.projectName,
      })),
      error: null,

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

      register: (username, password, displayName, role = 'Manager') => {
        if (runtimeUsers.find(u => u.username === username)) {
          set({ error: 'Username already exists' })
          return false
        }
        if (password.length < 6) {
          set({ error: 'Password must be at least 6 characters' })
          return false
        }
        const newUser: User = {
          username,
          role,
          displayName: displayName || username,
          projectName: 'AI Office Demo',
        }
        runtimeUsers = [...runtimeUsers, { ...newUser, password }]
        set(s => ({
          currentUser: newUser,
          users: [...s.users, newUser],
          error: null,
        }))
        switchUserStore(username)
        return true
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'ai-office-auth' }
  )
)
