'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAppStore } from './useAppStore'
import { useSettingsStore } from './useSettingsStore'
import type { User } from '@/types'

const SEED_USERS = [
  { username: 'admin',    password: 'demo1234', role: 'Admin'     as const, displayName: 'Admin User', projectName: 'AI Office Demo', projectId: undefined as string | undefined },
  { username: 'qa_lead',  password: 'test5678', role: 'QA'        as const, displayName: 'QA Lead',    projectName: 'AI Office Demo', projectId: undefined as string | undefined },
  { username: 'dev_lead', password: 'dev9999',  role: 'Developer' as const, displayName: 'Dev Lead',   projectName: 'AI Office Demo', projectId: undefined as string | undefined },
]

interface AuthState {
  currentUser: User | null
  users:       User[]
  error:       string | null
  login:       (username: string, password: string) => boolean
  logout:      () => void
  register:    (username: string, password: string, displayName: string, projectName: string, role?: User['role']) => boolean
  clearError:  () => void
}

type RuntimeUser = { username: string; password: string; role: User['role']; displayName: string; projectName: string; projectId?: string }

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
      users: [],
      error: null,

      login: (username, password) => {
        const user = runtimeUsers.find(
          u => u.username === username && u.password === password
        )
        if (user) {
          const currentUser: User = {
            username:    user.username,
            role:        user.role,
            displayName: user.displayName,
            projectName: user.projectName,
            projectId:   user.projectId,
          }
          set({ currentUser, error: null })
          switchUserStore(user.username)
          // Seed settings projectName if not already set
          const settingsProjectName = useSettingsStore.getState().projectName
          if (!settingsProjectName && user.projectName) {
            useSettingsStore.getState().setProjectName(user.projectName)
          }
          return true
        }
        set({ error: 'Invalid username or password' })
        return false
      },

      logout: () => {
        useAppStore.getState().resetStore()
        useAppStore.persist.setOptions({ name: 'ai-office-store-guest' })
        set({ currentUser: null, error: null })
      },

      register: (username, password, displayName, projectName, role = 'Manager') => {
        if (runtimeUsers.find(u => u.username === username)) {
          set({ error: 'Username already exists' })
          return false
        }
        if (password.length < 6) {
          set({ error: 'Password must be at least 6 characters' })
          return false
        }
        const projectId = crypto.randomUUID()
        const newUser: User = {
          username,
          role,
          displayName: displayName || username,
          projectName: projectName || 'My Project',
          projectId,
        }
        runtimeUsers = [...runtimeUsers, { ...newUser, password, projectId }]
        set(s => ({
          currentUser: newUser,
          users: [...s.users, newUser],
          error: null,
        }))
        switchUserStore(username)
        // Seed settings projectName from registration
        if (projectName) {
          useSettingsStore.getState().setProjectName(projectName)
        }
        return true
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'ai-office-auth' }
  )
)
