'use client'
import { useRef, useState } from 'react'
import { useSettingsStore, DodItem } from '@/store/useSettingsStore'
import { Topbar } from '@/components/shared/Topbar'

const MODELS = [
  { id: 'claude-haiku-4-5-20251001',   name: 'Claude Haiku 4.5',  desc: 'Fast & cheap · Default' },
  { id: 'claude-sonnet-4-5-20250514',  name: 'Claude Sonnet 4.5', desc: 'Better quality · Recommended' },
  { id: 'claude-opus-4-5-20250514',    name: 'Claude Opus 4.5',   desc: 'Highest quality · Slowest' },
]

const NAV_SECTIONS = [
  { heading: 'GENERAL',      items: [{ id: 'project', label: 'Project Info' }, { id: 'model', label: 'AI Model' }] },
  { heading: 'INTEGRATIONS', items: [{ id: 'webhooks', label: 'Webhooks' }] },
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
function ModelSection() {
  const { model, updateModel, autoTranslate, setAutoTranslate } = useSettingsStore()

  return (
    <div id="model" style={card}>
      <SectionTitle>AI Model</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {MODELS.map(m => {
          const active = model === m.id
          return (
            <div
              key={m.id}
              onClick={() => updateModel(m.id)}
              style={{
                border: `2px solid ${active ? '#534AB7' : '#e8e8f0'}`,
                borderRadius: 8,
                padding: '14px 18px',
                cursor: 'pointer',
                background: active ? '#f7f6ff' : '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                border: `2px solid ${active ? '#534AB7' : '#ccc'}`,
                background: active ? '#534AB7' : '#fff',
                flexShrink: 0,
              }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e' }}>{m.name}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{m.desc}</div>
              </div>
            </div>
          )
        })}
      </div>

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

// ─── About Section ───────────────────────────────────────────────────────────
function AboutSection() {
  return (
    <div id="about" style={card}>
      <SectionTitle>About</SectionTitle>
      <table style={{ borderCollapse: 'collapse', fontSize: 13, color: '#444' }}>
        <tbody>
          {[
            ['App version',  '3.1.0'],
            ['Build date',   '2026-05-16'],
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
  const [active, setActive] = useState('project')
  const contentRef = useRef<HTMLDivElement>(null)

  function scrollTo(id: string) {
    setActive(id)
    const el = document.getElementById(id)
    if (el && contentRef.current) {
      contentRef.current.scrollTo({ top: el.offsetTop - 24, behavior: 'smooth' })
    }
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
                onClick={() => scrollTo(item.id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  fontSize: 13, padding: '7px 20px', border: 'none', cursor: 'pointer',
                  background: active === item.id ? '#f0eff7' : 'none',
                  color:      active === item.id ? '#534AB7' : '#555',
                  fontWeight: active === item.id ? 600 : 400,
                  borderLeft: active === item.id ? '3px solid #534AB7' : '3px solid transparent',
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
        <WebhooksSection />
        <DodSection />
        <AboutSection />
      </main>
    </div>
    </>
  )
}
