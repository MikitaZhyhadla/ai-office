import { useSettingsStore } from '@/store/useSettingsStore'

let _repoContextCache: { product?: string; test?: string } = {}

export function setRepoContextCache(ctx: { product?: string; test?: string }): void {
  _repoContextCache = ctx
}

export function clearRepoContextCache(): void {
  _repoContextCache = {}
}

const DOMAIN_OPTIONS = [
  { value: 'fintech',     label: 'Fintech',           description: 'Financial services, payments, banking, lending, insurance, crypto' },
  { value: 'ecommerce',   label: 'E-commerce',         description: 'Online retail, marketplaces, product catalogs, checkout, fulfillment' },
  { value: 'healthtech',  label: 'Healthtech',          description: 'Healthcare software, EHR, telemedicine, medical devices, patient data' },
  { value: 'edtech',      label: 'EdTech',              description: 'Online learning, LMS, courses, student/teacher workflows' },
  { value: 'saas_b2b',    label: 'SaaS B2B',            description: 'Business software, subscriptions, multi-tenant, enterprise features' },
  { value: 'marketplace', label: 'Marketplace',         description: 'Two-sided platforms, buyer/seller flows, ratings, payments' },
  { value: 'logistics',   label: 'Logistics',           description: 'Supply chain, delivery tracking, warehousing, fleet management' },
  { value: 'hrtech',      label: 'HR Tech',             description: 'Recruiting, onboarding, payroll, performance management' },
  { value: 'devtools',    label: 'Developer Tools',     description: 'IDEs, CLIs, APIs, SDKs, developer platforms' },
  { value: 'custom',      label: 'Other / Custom',      description: '' },
]

export function buildAgentContext(repoContexts?: { product?: string; test?: string }): string {
  const s = useSettingsStore.getState()
  const parts: string[] = []
  const effectiveRepoContexts = repoContexts ?? _repoContextCache

  if (s.domainEnabled && s.selectedDomain) {
    const domainOption = DOMAIN_OPTIONS.find(d => d.value === s.selectedDomain)
    const domainLabel = domainOption?.label ?? s.selectedDomain
    const domainDesc = s.selectedDomain === 'custom'
      ? s.customDomain
      : (domainOption?.description ?? '')

    parts.push(
      `Domain context: This product operates in the ${domainLabel} industry.\n${domainDesc}\nApply domain-specific knowledge, terminology, and compliance considerations in your analysis.`
    )
  }

  if (s.productContextEnabled) {
    const lines: string[] = ['Product context:']
    if (s.productDescription) lines.push(`Description: ${s.productDescription}`)
    if (s.techStack)          lines.push(`Tech stack: ${s.techStack}`)
    if (s.targetUsers)        lines.push(`Target users: ${s.targetUsers}`)
    if (s.keyConstraints)     lines.push(`Key constraints: ${s.keyConstraints}`)
    lines.push('Use this context to make your analysis more specific and relevant.')
    parts.push(lines.join('\n'))
  }

  if (effectiveRepoContexts?.product) parts.push(effectiveRepoContexts.product)
  if (effectiveRepoContexts?.test)    parts.push(effectiveRepoContexts.test)

  return parts.join('\n\n')
}
