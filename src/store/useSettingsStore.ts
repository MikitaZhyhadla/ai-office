'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DodItem {
  id: string
  label: string
  required: boolean
}

interface JiraConfig {
  enabled: boolean
  baseUrl: string
  projectKey: string
  apiToken: string
  userEmail: string
}

interface AzureConfig {
  enabled: boolean
  orgUrl: string
  project: string
  patToken: string
}

interface SettingsState {
  model: string
  projectName: string
  projectDescription: string
  teamSize: number
  jira: JiraConfig
  azure: AzureConfig
  dodItems: DodItem[]
  autoTranslate: boolean
  // F-02 Product Context
  productContextEnabled: boolean
  productDescription: string
  techStack: string
  targetUsers: string
  keyConstraints: string
  // F-01 Domain Area
  domainEnabled: boolean
  selectedDomain: string
  customDomain: string
  updateProject: (data: { projectName?: string; projectDescription?: string; teamSize?: number }) => void
  setProjectName: (name: string) => void
  updateModel: (model: string) => void
  updateJira: (data: Partial<JiraConfig>) => void
  updateAzure: (data: Partial<AzureConfig>) => void
  updateDodItems: (items: DodItem[]) => void
  setAutoTranslate: (v: boolean) => void
  setProductContextEnabled: (v: boolean) => void
  setProductDescription: (v: string) => void
  setTechStack: (v: string) => void
  setTargetUsers: (v: string) => void
  setKeyConstraints: (v: string) => void
  setDomainEnabled: (v: boolean) => void
  setSelectedDomain: (v: string) => void
  setCustomDomain: (v: string) => void
}

const DEFAULT_DOD_ITEMS: DodItem[] = [
  { id: 'dod-1', label: 'Acceptance criteria verified', required: true },
  { id: 'dod-2', label: 'Test cases reviewed and passed', required: true },
  { id: 'dod-3', label: 'Code reviewed by at least one team member', required: true },
  { id: 'dod-4', label: 'No known blocking bugs', required: true },
  { id: 'dod-5', label: 'Documentation updated (if applicable)', required: true },
]

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      model: 'claude-haiku-4-5-20251001',
      projectName: '',
      projectDescription: '',
      teamSize: 1,
      jira: {
        enabled: false,
        baseUrl: '',
        projectKey: '',
        apiToken: '',
        userEmail: '',
      },
      azure: {
        enabled: false,
        orgUrl: '',
        project: '',
        patToken: '',
      },
      dodItems: DEFAULT_DOD_ITEMS,
      autoTranslate: false,
      productContextEnabled: false,
      productDescription: '',
      techStack: '',
      targetUsers: '',
      keyConstraints: '',
      domainEnabled: false,
      selectedDomain: '',
      customDomain: '',

      updateProject: (data) => set((s) => ({ ...s, ...data })),
      setProjectName: (name) => set({ projectName: name }),
      updateModel: (model) => set({ model }),
      updateJira: (data) => set((s) => ({ jira: { ...s.jira, ...data } })),
      updateAzure: (data) => set((s) => ({ azure: { ...s.azure, ...data } })),
      updateDodItems: (items) => set({ dodItems: items }),
      setAutoTranslate: (v) => set({ autoTranslate: v }),
      setProductContextEnabled: (v) => set({ productContextEnabled: v }),
      setProductDescription: (v) => set({ productDescription: v }),
      setTechStack: (v) => set({ techStack: v }),
      setTargetUsers: (v) => set({ targetUsers: v }),
      setKeyConstraints: (v) => set({ keyConstraints: v }),
      setDomainEnabled: (v) => set({ domainEnabled: v }),
      setSelectedDomain: (v) => set({ selectedDomain: v }),
      setCustomDomain: (v) => set({ customDomain: v }),
    }),
    { name: 'ai-office-settings' }
  )
)
