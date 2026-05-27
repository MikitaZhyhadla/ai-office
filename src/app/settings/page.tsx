'use client'
import { useRef, useState, useEffect } from 'react'
import { useSettingsStore, DodItem } from '@/store/useSettingsStore'
import { Topbar } from '@/components/shared/Topbar'
import { BUILD_INFO } from '@/generated/buildInfo'
import { AgentModelRow } from '@/components/settings/AgentModelRow'
import { CostEstimator, computeCost } from '@/components/settings/CostEstimator'

const MODELS = [
  { id: 'claude-haiku-4-5-20251001',   name: 'Claude Haiku 4.5',  desc: 'Fast & cheap · Default' },
  { id: 'claude-sonnet-4-5-20250514',  name: 'Claude Sonnet 4.5', desc: 'Better quality · Recommended' },
  { id: 'claude-opus-4-5-20250514',    name: 'Claude Opus 4.5',   desc: 'Highest quality · Slowest' },
]

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

const NAV_SECTIONS = [
  { heading: 'GENERAL',      items: [{ id: 'project', label: 'Project Info' }, { id: 'model', label: 'AI Model' }] },
  { heading: 'AI CONTEXT',   items: [{ id: 'product-context', label: 'Product Context' }, { id: 'domain-area', label: 'Domain Area' }] },
  { heading: 'INTEGRATIONS', items: [{ id: 'github', label: 'GitHub' }, { id: 'webhooks', label: 'Webhooks' }] },
  { heading: 'WORKFLOW',     items: [{ id: 'dod', label: 'Definition of Done' }] },
  { heading: 'INFO',         items: [{ id: 'about', label: 'About' }] },
]

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e8e8f0',
  borderRadius: 10,
  padding: 24,
  marginBottom: 24,
}

const label: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#555',
  marginBottom: 6,
}

const input: React.CSSProperties = {
  width: '100%',
  fontSize: 13,
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid #e8e8f0',
  outline: 'none',
  boxSizing: 'border-box',
  color: '#333',
  background: '#fff',
}

const disabledInput: React.CSSProperties = {
  ...input,
  background: '#f8f8fc',
  color: '#aaa',
}

const saveBtn: React.CSSProperties = {
  marginTop: 16,
  padding: '8px 20px',
  borderRadius: 6,
  border: 'none',
  background: '#534AB7',
  color: '#fff',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px' }}>
      {children}
    </h2>
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, color: '#999', margin: '4px 0 0' }}>{children}</p>
}

// ─── Project Info Section ────────────────────────────────────────────────────
function ProjectSection() {
  const { projectName, projectDescription, teamSize, updateProject } = useSettingsStore()
  const [name, setName]   = useState(projectName)
  const [desc, setDesc]   = useState(projectDescription)
  const [size, setSize]   = useState(teamSize)
  const [saved, setSaved] = useState(false)

  function save() {
    updateProject({ projectName: name, projectDescription: desc, teamSize: size })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div id="project" style={card}>
      <SectionTitle>Project Info</SectionTitle>

      <div style={{ marginBottom: 16 }}>
        <span style={label}>Project Name</span>
        <input style={input} value={name} onChange={e => setName(e.target.value)} placeholder="My Project" />
      </div>

      <div style={{ marginBottom: 16 }}>
        <span style={label}>Project Description</span>
        <textarea
          rows={4}
          style={{ ...input, resize: 'vertical' }}
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Describe the project..."
        />
        <Hint>Used as context for all AI agents</Hint>
      </div>

      <div style={{ marginBottom: 16 }}>
        <span style={label}>Team Size</span>
        <input
          style={{ ...input, width: 100 }}
          type="number"
          min={1}
          max={100}
          value={size}
          onChange={e => setSize(Number(e.target.value))}
        />
      </div>

      <button style={saveBtn} onClick={save}>
        {saved ? '✓ Saved' : 'Save'}
      </button>
    </div>
  )
}

// ─── AI Model Section ────────────────────────────────────────────────────────
const MODEL_RADIO_OPTIONS = [
  {
    value: 'claude-haiku-4-5-20251001',
    label: 'Claude Haiku 4.5',
    badge: 'Fastest', badgeBg: '#EAF3DE', badgeColor: '#27500A',
    desc: 'Most cost-efficient. Best for high-volume analysis.',
    cost: 'Input $0.80 / Output $4.00 per 1M tokens',
  },
  {
    value: 'claude-sonnet-4-20250514',
    label: 'Claude Sonnet 4',
    badge: 'Recommended', badgeBg: '#EEEDFE', badgeColor: '#534AB7',
    desc: 'Balanced performance and intelligence. Recommended for complex requirements analysis.',
    cost: 'Input $3.00 / Output $15.00 per 1M tokens',
  },
  {
    value: 'claude-opus-4-20250514',
    label: 'Claude Opus 4',
    badge: 'Most capable', badgeBg: '#FAEEDA', badgeColor: '#854F0B',
    desc: 'Highest intelligence for the most nuanced tasks.',
    cost: 'Input $15.00 / Output $75.00 per 1M tokens',
  },
]

function ModelSection() {
  const { model, updateModel, autoTranslate, setAutoTranslate } = useSettingsStore()
  const overrideOn      = useSettingsStore(s => s.agentModelOverride)
  const agentModels     = useSettingsStore(s => s.agentModels)
  const setAgentModelOverride = useSettingsStore(s => s.setAgentModelOverride)
  const setAgentModel   = useSettingsStore(s => s.setAgentModel)

  function handleOverrideToggle(val: boolean) {
    if (val) {
      const keys: Array<keyof typeof agentModels> = ['aliceBA', 'bobBA', 'qaLead', 'devLead']
      keys.forEach(k => setAgentModel(k, model || 'claude-haiku-4-5-20251001'))
    }
    setAgentModelOverride(val)
  }

  return (
    <div id="model" style={card}>
      <SectionTitle>AI Model</SectionTitle>
      <p style={{ fontSize: 12, color: '#888', margin: '0 0 16px' }}>
        Choose the default Claude model, or override individually per agent.
      </p>

      {/* Default model heading */}
      <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 10px', color: overrideOn ? '#999AAA' : '#1A1A2E' }}>
        {overrideOn ? 'Default model (disabled while override is on)' : 'Default model for all agents'}
      </h3>

      {/* Radio options */}
      {MODEL_RADIO_OPTIONS.map(opt => {
        const isSelected = model === opt.value
        return (
          <div
            key={opt.value}
            onClick={() => !overrideOn && updateModel(opt.value)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '11px 13px',
              border: isSelected && !overrideOn ? '2px solid #534AB7' : '1px solid #EEEDF8',
              borderRadius: '8px', marginBottom: '7px',
              background: isSelected && !overrideOn ? '#EEEDFE' : '#FFFFFF',
              cursor: overrideOn ? 'not-allowed' : 'pointer',
              opacity: overrideOn ? 0.4 : 1,
              transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
              border: isSelected && !overrideOn ? '5px solid #534AB7' : '1.5px solid #CCC',
              marginTop: '2px',
            }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', marginBottom: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{opt.label}</span>
                <span style={{
                  fontSize: '10px', padding: '1px 7px', borderRadius: '10px',
                  background: opt.badgeBg, color: opt.badgeColor, fontWeight: 600,
                }}>
                  {opt.badge}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#555566', marginBottom: '2px' }}>{opt.desc}</div>
              <div style={{ fontSize: '11px', color: '#BBBBBB' }}>{opt.cost}</div>
            </div>
          </div>
        )
      })}

      {/* Divider */}
      <div style={{ height: '1px', background: '#EEEDF8', margin: '14px 0' }} />

      {/* Override toggle */}
      <div
        onClick={() => handleOverrideToggle(!overrideOn)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
      >
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A2E' }}>Override per agent</div>
          <div style={{ fontSize: '12px', color: '#999AAA', marginTop: '1px' }}>Set a different model for specific agents</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '34px', height: '18px', borderRadius: '9px',
            background: overrideOn ? '#534AB7' : '#CCCCCC',
            position: 'relative', transition: 'background 0.2s',
          }}>
            <div style={{
              position: 'absolute', top: '2px',
              left: overrideOn ? '18px' : '2px',
              width: '14px', height: '14px', borderRadius: '50%',
              background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
              transition: 'left 0.2s',
            }} />
          </div>
          <span style={{
            fontSize: '11px', color: '#999',
            transform: overrideOn ? 'rotate(180deg)' : 'none',
            display: 'inline-block', transition: 'transform 0.2s',
          }}>▾</span>
        </div>
      </div>

      {/* Agent override table */}
      {overrideOn && (
        <div style={{ marginTop: '12px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '28px 100px 46px 1fr 80px',
            gap: '8px', paddingBottom: '6px', borderBottom: '1px solid #EEEDF8', marginBottom: '2px',
          }}>
            {['', 'AGENT', 'ROLE', 'MODEL', 'EST. COST'].map(h => (
              <span key={h} style={{ fontSize: '10px', color: '#999AAA', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {([
            { key: 'aliceBA' as const,  dot: '#534AB7', name: 'Alice BA',  role: 'BA',   roleBg: '#EEEDFE', roleColor: '#534AB7' },
            { key: 'bobBA' as const,    dot: '#7F77DD', name: 'Bob BA',    role: 'BA',   roleBg: '#EEEDFE', roleColor: '#534AB7' },
            { key: 'qaLead' as const,   dot: '#0F6E56', name: 'QA Lead',   role: 'QA',   roleBg: '#E1F5EE', roleColor: '#0F6E56' },
            { key: 'devLead' as const,  dot: '#854F0B', name: 'Dev Lead',  role: 'DEV',  roleBg: '#FAEEDA', roleColor: '#854F0B' },
          ] as const).map(agent => (
            <AgentModelRow
              key={agent.key}
              dotColor={agent.dot}
              name={agent.name}
              role={agent.role}
              roleBg={agent.roleBg}
              roleColor={agent.roleColor}
              modelValue={agentModels[agent.key]}
              onModelChange={(val) => setAgentModel(agent.key, val)}
              estimatedCost={`~$${computeCost(agentModels[agent.key]).toFixed(4)}`}
            />
          ))}

          <AgentModelRow
            dotColor="#185FA5"
            name="SDET Agent"
            role="SDET"
            roleBg="#E6F1FB"
            roleColor="#185FA5"
            modelValue="claude-haiku-4-5-20251001"
            onModelChange={() => {}}
            estimatedCost="phase 5"
            isPhase5
          />

          <CostEstimator
            rows={[
              { name: 'Alice BA',  model: agentModels.aliceBA,  cost: computeCost(agentModels.aliceBA) },
              { name: 'Bob BA',    model: agentModels.bobBA,    cost: computeCost(agentModels.bobBA) },
              { name: 'QA Lead',   model: agentModels.qaLead,   cost: computeCost(agentModels.qaLead) },
              { name: 'Dev Lead',  model: agentModels.devLead,  cost: computeCost(agentModels.devLead) },
            ]}
          />
        </div>
      )}

      {/* Auto-Translation sub-section */}
      <div style={{ marginTop: 24, borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e', marginBottom: 4 }}>
              🌐 Auto-Translation
            </div>
            <div style={{ fontSize: 11, color: '#888', lineHeight: 1.6 }}>
              Automatically translate Russian input to English before BA agent analysis.
              Always uses Claude Haiku (fast &amp; cheap — adds ~50ms per request).
            </div>
          </div>
          <button
            role="switch"
            aria-checked={autoTranslate}
            onClick={() => setAutoTranslate(!autoTranslate)}
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              background: autoTranslate ? '#534AB7' : '#d0d0d0',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute',
              top: 2,
              left: autoTranslate ? 18 : 2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'white',
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              display: 'block',
            }} />
          </button>
        </div>
        <div style={{
          background: '#f0f8ff',
          border: '1px solid #b0d4f0',
          borderRadius: 8,
          padding: '10px 13px',
          fontSize: 11,
          color: '#1a6fa0',
          marginTop: 12,
        }}>
          ℹ️ Auto-translation always uses Haiku model regardless of your model selection above, to minimize cost.
        </div>
      </div>
    </div>
  )
}

// ─── Webhooks Section ────────────────────────────────────────────────────────
type ConnStatus = 'idle' | 'testing' | 'ok' | 'fail'

function WebhooksSection() {
  const { jira, azure, updateJira, updateAzure } = useSettingsStore()
  const [jiraStatus,   setJiraStatus]   = useState<ConnStatus>('idle')
  const [azureStatus,  setAzureStatus]  = useState<ConnStatus>('idle')
  const [jiraMessage,  setJiraMessage]  = useState<string>('')
  const [azureMessage, setAzureMessage] = useState<string>('')

  async function testJira() {
    setJiraStatus('testing')
    setJiraMessage('')
    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'jira',
          credentials: { baseUrl: jira.baseUrl, apiToken: jira.apiToken, userEmail: jira.userEmail },
        }),
      })
      const data = await res.json()
      setJiraStatus(data.success ? 'ok' : 'fail')
      setJiraMessage(data.message ?? '')
    } catch (err) {
      setJiraStatus('fail')
      setJiraMessage(String(err))
    }
  }

  async function testAzure() {
    setAzureStatus('testing')
    setAzureMessage('')
    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'azure',
          credentials: { orgUrl: azure.orgUrl, patToken: azure.patToken },
        }),
      })
      const data = await res.json()
      setAzureStatus(data.success ? 'ok' : 'fail')
      setAzureMessage(data.message ?? '')
    } catch (err) {
      setAzureStatus('fail')
      setAzureMessage(String(err))
    }
  }

  const statusIcon = (s: ConnStatus) =>
    s === 'ok'      ? <span style={{ color: '#22c55e', fontWeight: 700 }}>✓</span> :
    s === 'fail'    ? <span style={{ color: '#ef4444', fontWeight: 700 }}>✗</span> :
    s === 'testing' ? <span style={{ color: '#888' }}>…</span> : null

  const toggleStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: 8,
    fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 16,
  }

  function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
    return (
      <div style={toggleStyle} onClick={onToggle}>
        <div style={{
          width: 34, height: 18, borderRadius: 9,
          background: enabled ? '#534AB7' : '#ddd',
          position: 'relative', transition: 'background 0.2s',
        }}>
          <div style={{
            position: 'absolute', top: 2, left: enabled ? 16 : 2,
            width: 14, height: 14, borderRadius: '50%', background: '#fff',
            transition: 'left 0.2s',
          }} />
        </div>
        {enabled ? 'Enabled' : 'Disabled'}
      </div>
    )
  }

  const testBtnStyle: React.CSSProperties = {
    padding: '7px 16px', borderRadius: 6, border: '1px solid #e8e8f0',
    background: '#fff', fontSize: 12, cursor: 'pointer', color: '#534AB7',
    fontWeight: 600, marginTop: 12,
  }

  return (
    <div id="webhooks" style={card}>
      <SectionTitle>Webhooks</SectionTitle>

      {/* Jira */}
      <div style={{ border: '1px solid #e8e8f0', borderRadius: 8, padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>Jira</span>
          {statusIcon(jiraStatus)}
        </div>
        <Toggle enabled={jira.enabled} onToggle={() => { updateJira({ enabled: !jira.enabled }); setJiraStatus('idle') }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { key: 'baseUrl',    lbl: 'Base URL',     ph: 'https://your-org.atlassian.net' },
            { key: 'projectKey', lbl: 'Project Key',  ph: 'PRJ' },
            { key: 'apiToken',   lbl: 'API Token',    ph: '••••••••' },
            { key: 'userEmail',  lbl: 'User Email',   ph: 'you@company.com' },
          ].map(f => (
            <div key={f.key}>
              <span style={label}>{f.lbl}</span>
              <input
                style={jira.enabled ? input : disabledInput}
                disabled={!jira.enabled}
                type={f.key === 'apiToken' ? 'password' : 'text'}
                value={(jira as unknown as Record<string, string>)[f.key]}
                onChange={e => updateJira({ [f.key]: e.target.value } as Partial<typeof jira>)}
                placeholder={f.ph}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <button style={{ ...testBtnStyle, marginTop: 0, opacity: jira.enabled ? 1 : 0.4 }}
            disabled={!jira.enabled || jiraStatus === 'testing'} onClick={testJira}>
            {jiraStatus === 'testing' ? 'Testing…' : 'Test Connection'}
          </button>
          {jiraMessage && (
            <span style={{ fontSize: 12, color: jiraStatus === 'ok' ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
              {jiraStatus === 'ok' ? '✓ ' : '✗ '}{jiraMessage}
            </span>
          )}
        </div>
      </div>

      {/* Azure */}
      <div style={{ border: '1px solid #e8e8f0', borderRadius: 8, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>Azure DevOps</span>
          {statusIcon(azureStatus)}
        </div>
        <Toggle enabled={azure.enabled} onToggle={() => { updateAzure({ enabled: !azure.enabled }); setAzureStatus('idle') }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { key: 'orgUrl',    lbl: 'Organisation URL', ph: 'https://dev.azure.com/your-org' },
            { key: 'project',   lbl: 'Project Name',     ph: 'MyProject' },
            { key: 'patToken',  lbl: 'PAT Token',        ph: '••••••••' },
          ].map(f => (
            <div key={f.key}>
              <span style={label}>{f.lbl}</span>
              <input
                style={azure.enabled ? input : disabledInput}
                disabled={!azure.enabled}
                type={f.key === 'patToken' ? 'password' : 'text'}
                value={(azure as unknown as Record<string, string>)[f.key]}
                onChange={e => updateAzure({ [f.key]: e.target.value } as Partial<typeof azure>)}
                placeholder={f.ph}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <button style={{ ...testBtnStyle, marginTop: 0, opacity: azure.enabled ? 1 : 0.4 }}
            disabled={!azure.enabled || azureStatus === 'testing'} onClick={testAzure}>
            {azureStatus === 'testing' ? 'Testing…' : 'Test Connection'}
          </button>
          {azureMessage && (
            <span style={{ fontSize: 12, color: azureStatus === 'ok' ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
              {azureStatus === 'ok' ? '✓ ' : '✗ '}{azureMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Definition of Done Section ──────────────────────────────────────────────
function DodSection() {
  const { dodItems, updateDodItems } = useSettingsStore()

  function toggle(id: string) {
    updateDodItems(dodItems.map(d => d.id === id ? { ...d, required: !d.required } : d))
  }

  function editLabel(id: string, value: string) {
    updateDodItems(dodItems.map(d => d.id === id ? { ...d, label: value } : d))
  }

  function remove(id: string) {
    updateDodItems(dodItems.filter(d => d.id !== id))
  }

  function addItem() {
    const newItem: DodItem = { id: `dod-${Date.now()}`, label: '', required: true }
    updateDodItems([...dodItems, newItem])
  }

  return (
    <div id="dod" style={card}>
      <SectionTitle>Definition of Done</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dodItems.map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 6, border: '1px solid #e8e8f0',
            background: '#fafafa',
          }}>
            <input
              type="checkbox"
              checked={item.required}
              onChange={() => toggle(item.id)}
              style={{ accentColor: '#534AB7', width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }}
            />
            <input
              style={{ flex: 1, fontSize: 13, border: 'none', background: 'transparent',
                       outline: 'none', color: '#333' }}
              value={item.label}
              onChange={e => editLabel(item.id, e.target.value)}
              placeholder="Enter criterion…"
            />
            <button
              onClick={() => remove(item.id)}
              style={{ background: 'none', border: 'none', color: '#ccc',
                       cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 4px' }}
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addItem}
        style={{ ...saveBtn, marginTop: 14, background: '#fff', color: '#534AB7',
                 border: '1px dashed #534AB7' }}
      >
        + Add Item
      </button>
    </div>
  )
}

// ─── Product Context Section (F-02) ─────────────────────────────────────────
function ProductContextSection() {
  const {
    productContextEnabled, setProductContextEnabled,
    productDescription, setProductDescription,
    techStack, setTechStack,
    targetUsers, setTargetUsers,
    keyConstraints, setKeyConstraints,
  } = useSettingsStore()

  return (
    <div id="product-context" style={card}>
      <SectionTitle>Product Context</SectionTitle>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <input
          type="checkbox"
          id="productContextEnabled"
          checked={productContextEnabled}
          onChange={e => setProductContextEnabled(e.target.checked)}
          style={{ accentColor: '#534AB7', width: 15, height: 15, cursor: 'pointer' }}
        />
        <label htmlFor="productContextEnabled" style={{ fontSize: 13, color: '#333', cursor: 'pointer', userSelect: 'none' }}>
          Include product context in agent analysis
        </label>
      </div>

      <div style={{ opacity: productContextEnabled ? 1 : 0.5, pointerEvents: productContextEnabled ? 'auto' : 'none' }}>
        <div style={{ marginBottom: 16 }}>
          <span style={label}>Product Description</span>
          <textarea
            rows={3}
            style={{ ...input, resize: 'vertical' }}
            value={productDescription}
            onChange={e => setProductDescription(e.target.value)}
            placeholder="What does your product do? Describe its purpose."
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <span style={label}>Tech Stack</span>
          <input
            style={input}
            value={techStack}
            onChange={e => setTechStack(e.target.value)}
            placeholder="Next.js 14, PostgreSQL, AWS, React Native"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <span style={label}>Target Users</span>
          <input
            style={input}
            value={targetUsers}
            onChange={e => setTargetUsers(e.target.value)}
            placeholder="B2B SaaS, enterprise teams of 10–200 people"
          />
        </div>

        <div>
          <span style={label}>Key Constraints</span>
          <input
            style={input}
            value={keyConstraints}
            onChange={e => setKeyConstraints(e.target.value)}
            placeholder="GDPR compliance required, mobile-first, offline support"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Domain Area Section (F-01) ───────────────────────────────────────────────
function DomainAreaSection() {
  const {
    domainEnabled, setDomainEnabled,
    selectedDomain, setSelectedDomain,
    customDomain, setCustomDomain,
  } = useSettingsStore()

  const selected = DOMAIN_OPTIONS.find(d => d.value === selectedDomain)

  return (
    <div id="domain-area" style={card}>
      <SectionTitle>Domain Area</SectionTitle>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <input
          type="checkbox"
          id="domainEnabled"
          checked={domainEnabled}
          onChange={e => setDomainEnabled(e.target.checked)}
          style={{ accentColor: '#534AB7', width: 15, height: 15, cursor: 'pointer' }}
        />
        <label htmlFor="domainEnabled" style={{ fontSize: 13, color: '#333', cursor: 'pointer', userSelect: 'none' }}>
          Enable domain context for agents
        </label>
      </div>

      <div style={{ opacity: domainEnabled ? 1 : 0.5, pointerEvents: domainEnabled ? 'auto' : 'none' }}>
        <div style={{ marginBottom: 12 }}>
          <span style={label}>Domain</span>
          <select
            style={{ ...input, cursor: 'pointer' }}
            value={selectedDomain}
            onChange={e => setSelectedDomain(e.target.value)}
          >
            <option value="">— Select a domain —</option>
            {DOMAIN_OPTIONS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        {selectedDomain && selectedDomain !== 'custom' && selected?.description && (
          <div style={{
            background: '#f9f9ff',
            borderLeft: '4px solid #534AB7',
            padding: '8px 12px',
            borderRadius: '0 6px 6px 0',
            fontSize: 12,
            color: '#666',
            fontStyle: 'italic',
          }}>
            {selected.description}
          </div>
        )}

        {selectedDomain === 'custom' && (
          <div>
            <span style={label}>Custom Domain Description</span>
            <textarea
              rows={3}
              style={{ ...input, resize: 'vertical' }}
              value={customDomain}
              onChange={e => setCustomDomain(e.target.value)}
              placeholder="Describe your domain area..."
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── GitHub Integration Section (F-03) ───────────────────────────────────────
type GithubConnStatus = 'idle' | 'testing' | 'ok' | 'fail'

function RepoPanel({
  title,
  enabled,
  onToggleEnabled,
  repoUrl,
  onRepoUrlChange,
  pat,
  onPatChange,
}: {
  title: string
  enabled: boolean
  onToggleEnabled: () => void
  repoUrl: string
  onRepoUrlChange: (v: string) => void
  pat: string
  onPatChange: (v: string) => void
}) {
  const [status, setStatus] = useState<GithubConnStatus>('idle')
  const [statusMsg, setStatusMsg] = useState('')

  async function testConnection() {
    if (!repoUrl) return
    setStatus('testing')
    setStatusMsg('')
    try {
      const repo = repoUrl.replace('https://github.com/', '').replace(/\/$/, '')
      const res = await fetch(`/api/github?repo=${encodeURIComponent(repo)}&type=readme`, {
        headers: pat ? { Authorization: `Bearer ${pat}` } : {},
      })
      if (res.ok) {
        const repoRes = await fetch(`/api/github?repo=${encodeURIComponent(repo)}&type=tree`, {
          headers: pat ? { Authorization: `Bearer ${pat}` } : {},
        })
        if (repoRes.ok) {
          setStatus('ok')
          setStatusMsg(`Connected — ${repo}`)
        } else {
          setStatus('fail')
          setStatusMsg('check URL and token')
        }
      } else {
        setStatus('fail')
        setStatusMsg('check URL and token')
      }
    } catch {
      setStatus('fail')
      setStatusMsg('Network error')
    }
  }

  const toggleStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: 8,
    fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 16,
  }

  return (
    <div style={{ border: '1px solid #e8e8f0', borderRadius: 8, padding: 18, marginBottom: 16 }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>{title}</div>

      <div style={toggleStyle} onClick={onToggleEnabled}>
        <div style={{
          width: 34, height: 18, borderRadius: 9,
          background: enabled ? '#534AB7' : '#ddd',
          position: 'relative', transition: 'background 0.2s',
        }}>
          <div style={{
            position: 'absolute', top: 2, left: enabled ? 16 : 2,
            width: 14, height: 14, borderRadius: '50%', background: '#fff',
            transition: 'left 0.2s',
          }} />
        </div>
        {enabled ? 'Enabled' : 'Disabled'}
      </div>

      <div style={{ opacity: enabled ? 1 : 0.5, pointerEvents: enabled ? 'auto' : 'none' }}>
        <div style={{ marginBottom: 12 }}>
          <span style={label}>Repository URL</span>
          <input
            style={input}
            value={repoUrl}
            onChange={e => { onRepoUrlChange(e.target.value); setStatus('idle') }}
            placeholder="https://github.com/username/my-app"
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <span style={label}>Personal Access Token</span>
          <input
            style={input}
            type="password"
            value={pat}
            onChange={e => { onPatChange(e.target.value); setStatus('idle') }}
            placeholder="ghp_..."
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={testConnection}
            disabled={!repoUrl || status === 'testing'}
            style={{
              padding: '7px 16px', borderRadius: 6, border: '1px solid #e8e8f0',
              background: '#fff', fontSize: 12, cursor: !repoUrl || status === 'testing' ? 'not-allowed' : 'pointer',
              color: '#534AB7', fontWeight: 600, opacity: !repoUrl ? 0.4 : 1,
            }}
          >
            {status === 'testing' ? 'Testing…' : 'Test connection'}
          </button>
          {status !== 'idle' && status !== 'testing' && (
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: status === 'ok' ? '#22c55e' : '#ef4444',
              background: status === 'ok' ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${status === 'ok' ? '#bbf7d0' : '#fecaca'}`,
              borderRadius: 6, padding: '3px 10px',
            }}>
              {status === 'ok' ? `✓ ${statusMsg}` : `✗ Not connected — ${statusMsg}`}
            </span>
          )}
          {status === 'testing' && (
            <span style={{ fontSize: 12, color: '#888' }}>Testing…</span>
          )}
        </div>

        <div style={{
          marginTop: 14, background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 8, padding: '10px 13px', fontSize: 11, color: '#166534',
        }}>
          Your PAT is stored locally in your browser and sent only to GitHub API via our secure server proxy.
          We recommend using a fine-grained PAT with read-only &lsquo;Contents&rsquo; permission.
        </div>
      </div>
    </div>
  )
}

function GitHubSection() {
  const { github, updateGithub } = useSettingsStore()

  return (
    <div id="github" style={card}>
      <SectionTitle>GitHub Integration</SectionTitle>

      <RepoPanel
        title="Product Codebase"
        enabled={github.productRepoEnabled}
        onToggleEnabled={() => updateGithub({ productRepoEnabled: !github.productRepoEnabled })}
        repoUrl={github.productRepoUrl}
        onRepoUrlChange={v => updateGithub({ productRepoUrl: v })}
        pat={github.productRepoPAT}
        onPatChange={v => updateGithub({ productRepoPAT: v })}
      />

      <RepoPanel
        title="Test Codebase"
        enabled={github.testRepoEnabled}
        onToggleEnabled={() => updateGithub({ testRepoEnabled: !github.testRepoEnabled })}
        repoUrl={github.testRepoUrl}
        onRepoUrlChange={v => updateGithub({ testRepoUrl: v })}
        pat={github.testRepoPAT}
        onPatChange={v => updateGithub({ testRepoPAT: v })}
      />
    </div>
  )
}

// ─── About Section ───────────────────────────────────────────────────────────
function AboutSection() {
  return (
    <div id="about" style={card}>
      <SectionTitle>About</SectionTitle>
      <table style={{ borderCollapse: 'collapse', fontSize: 13, color: '#444' }}>
        <tbody>
          {[
            ['App version',  BUILD_INFO.version],
            ['Build date',   BUILD_INFO.buildDate],
          ].map(([k, v]) => (
            <tr key={k}>
              <td style={{ paddingRight: 24, paddingBottom: 10, color: '#888', fontWeight: 500 }}>{k}</td>
              <td style={{ paddingBottom: 10 }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        <a href="https://github.com/MikitaZhyhadla/ai-office"
          target="_blank" rel="noreferrer"
          style={{ fontSize: 13, color: '#534AB7', textDecoration: 'none', fontWeight: 500 }}>
          GitHub Repository ↗
        </a>
        <a href="https://github.com/MikitaZhyhadla/ai-office/issues/new"
          target="_blank" rel="noreferrer"
          style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>
          Report a Bug ↗
        </a>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('project')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sectionIds = ['project', 'model', 'product-context', 'domain-area', 'github', 'webhooks', 'dod', 'about']

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id)
        }
      },
      {
        root: contentRef.current,
        rootMargin: '-10% 0px -60% 0px',
        threshold: 0,
      }
    )

    sectionIds.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  function scrollToSection(id: string) {
    const el = document.getElementById(id)
    if (el && contentRef.current) {
      contentRef.current.scrollTo({ top: el.offsetTop - 24, behavior: 'smooth' })
    }
    setActiveSection(id)
  }

  return (
    <>
    <Topbar />
    <div style={{ display: 'flex', height: 'calc(100vh - 48px)', background: '#f5f5fa' }}>
      {/* Sidebar */}
      <aside style={{
        width: 200, flexShrink: 0, background: '#fff',
        borderRight: '1px solid #e8e8f0', padding: '20px 0', overflowY: 'auto',
      }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.heading} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#bbb', padding: '6px 20px',
                          letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {section.heading}
            </div>
            {section.items.map(item => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  fontSize: 13, padding: '7px 20px', border: 'none', cursor: 'pointer',
                  background: activeSection === item.id ? '#f0eff7' : 'none',
                  color:      activeSection === item.id ? '#534AB7' : '#555',
                  fontWeight: activeSection === item.id ? 600 : 400,
                  borderLeft: activeSection === item.id ? '3px solid #534AB7' : '3px solid transparent',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Content */}
      <main ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', margin: '0 0 24px' }}>
          Settings
        </h1>
        <ProjectSection />
        <ModelSection />
        <ProductContextSection />
        <DomainAreaSection />
        <GitHubSection />
        <WebhooksSection />
        <DodSection />
        <AboutSection />
      </main>
    </div>
    </>
  )
}
