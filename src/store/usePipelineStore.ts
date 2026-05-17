"use client"
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Format, RequirementData, Severity } from '@/types'
import type { QAVerdict } from '@/agents/qaAgent'
import type { DevVerdict } from '@/agents/devAgent'
import type { TranslationResult } from '@/agents/translationAgent'

export type PipelineMode = 'idle' | 'analyzing' | 'review' | 'qa_check' | 'revision' | 'done'
export type PipelineInputMode = 'feature' | 'bug'

interface PipelineStore {
  inputText: string
  pipelineMode: PipelineMode
  selectedFormat: Format
  selectedType: PipelineInputMode
  baResult: RequirementData | null
  qaVerdict: QAVerdict | null
  devVerdict: DevVerdict | null
  isAnalyzing: boolean
  isApproving: boolean
  isRevising: boolean
  revisionCount: number
  translationResult: TranslationResult | null
  bugAffectedArea: string
  bugSeverityHint: Severity | null
  featureText: string
  featureFormat: Format

  setInputText: (text: string) => void
  setPipelineMode: (mode: PipelineMode) => void
  setSelectedFormat: (format: Format) => void
  setSelectedType: (type: PipelineInputMode) => void
  setBaResult: (result: RequirementData | null) => void
  setQaVerdict: (verdict: QAVerdict | null) => void
  setDevVerdict: (verdict: DevVerdict | null) => void
  setIsAnalyzing: (v: boolean) => void
  setIsApproving: (v: boolean) => void
  setIsRevising: (v: boolean) => void
  setRevisionCount: (n: number) => void
  setTranslationResult: (r: TranslationResult | null) => void
  setBugAffectedArea: (area: string) => void
  setBugSeverityHint: (hint: Severity | null) => void
  setFeatureText: (text: string) => void
  setFeatureFormat: (format: Format) => void
  reset: () => void
}

const initialState = {
  inputText: '',
  pipelineMode: 'idle' as PipelineMode,
  selectedFormat: 'gwt' as Format,
  selectedType: 'feature' as PipelineInputMode,
  baResult: null,
  qaVerdict: null,
  devVerdict: null,
  isAnalyzing: false,
  isApproving: false,
  isRevising: false,
  revisionCount: 0,
  translationResult: null,
  bugAffectedArea: '',
  bugSeverityHint: null,
  featureText: '',
  featureFormat: 'gwt' as Format,
}

export const usePipelineStore = create<PipelineStore>()(
  persist(
    (set) => ({
      ...initialState,
      setInputText: (inputText) => set({ inputText }),
      setPipelineMode: (pipelineMode) => set({ pipelineMode }),
      setSelectedFormat: (selectedFormat) => set({ selectedFormat }),
      setSelectedType: (selectedType) => set({ selectedType }),
      setBaResult: (baResult) => set({ baResult }),
      setQaVerdict: (qaVerdict) => set({ qaVerdict }),
      setDevVerdict: (devVerdict) => set({ devVerdict }),
      setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
      setIsApproving: (isApproving) => set({ isApproving }),
      setIsRevising: (isRevising) => set({ isRevising }),
      setRevisionCount: (revisionCount) => set({ revisionCount }),
      setTranslationResult: (translationResult) => set({ translationResult }),
      setBugAffectedArea: (bugAffectedArea) => set({ bugAffectedArea }),
      setBugSeverityHint: (bugSeverityHint) => set({ bugSeverityHint }),
      setFeatureText: (featureText) => set({ featureText }),
      setFeatureFormat: (featureFormat) => set({ featureFormat }),
      reset: () => set(initialState),
    }),
    { name: 'ai-office-pipeline' }
  )
)
