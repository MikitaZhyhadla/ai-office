'use client'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

type Tab = 'login' | 'register'

const inputBase: React.CSSProperties = {
  width: '100%',
  background: '#f8f8fc',
  border: '1px solid #e8e8f0',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

function Field({
  label,
  type = 'text',
  value,
  placeholder,
  onChange,
  onClear,
}: {
  label: string
  type?: string
  value: string
  placeholder: string
  onChange: (v: string) => void
  onClear: () => void
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: '#666', marginBottom: 5, display: 'block' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => { onChange(e.target.value); onClear() }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...inputBase, borderColor: focused ? '#534AB7' : '#e8e8f0' }}
      />
    </div>
  )
}

export function AuthScreen() {
  const { error, login, register, clearError } = useAuthStore()

  const [tab, setTab] = useState<Tab>('login')

  // Login fields
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')

  // Register fields
  const [regName,    setRegName]    = useState('')
  const [regUser,    setRegUser]    = useState('')
  const [regPass,    setRegPass]    = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { clearError(); setLocalError(null) }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleLogin() {
    setSubmitting(true)
    login(loginUser, loginPass)
    setSubmitting(false)
  }

  function handleRegister() {
    if (regPass !== regConfirm) {
      setLocalError('Passwords do not match')
      return
    }
    setLocalError(null)
    setSubmitting(true)
    register(regUser, regPass, regName)
    setSubmitting(false)
  }

  const displayedError = localError ?? error

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        padding: 32,
        width: '100%',
        maxWidth: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#534AB7' }}>AI Office</div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>Requirements Pipeline Tool</div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: '#f0eff7',
          borderRadius: 8,
          padding: 3,
          marginBottom: 24,
        }}>
          {(['login', 'register'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '8px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                fontFamily: 'inherit',
                background: tab === t ? '#fff' : 'none',
                color: tab === t ? '#534AB7' : '#888',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {t === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>

        {/* Error box */}
        {displayedError && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 12,
            color: '#791F1F',
            marginBottom: 14,
          }}>
            {displayedError}
          </div>
        )}

        {/* Login form */}
        {tab === 'login' && (
          <>
            <Field label="Username"  value={loginUser} placeholder="Enter username"  onChange={setLoginUser} onClear={clearError} />
            <Field label="Password"  type="password" value={loginPass} placeholder="Enter password"  onChange={setLoginPass} onClear={clearError} />

            <button
              onClick={handleLogin}
              disabled={submitting}
              style={{
                width: '100%',
                background: '#534AB7',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: 12,
                fontSize: 13,
                fontWeight: 500,
                cursor: submitting ? 'not-allowed' : 'pointer',
                marginTop: 8,
                opacity: submitting ? 0.6 : 1,
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#3C3489' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#534AB7' }}
            >
              Sign in
            </button>

            {/* Test credentials box */}
            <div
              onClick={() => { setLoginUser('admin'); setLoginPass('demo1234') }}
              style={{
                background: '#f0eff7',
                borderRadius: 8,
                padding: '10px 12px',
                marginTop: 16,
                cursor: 'pointer',
              }}
            >
              <div style={{
                fontSize: 10, fontWeight: 600, color: '#534AB7',
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6,
              }}>
                Test Credentials
              </div>
              {[
                { key: 'username', val: 'admin' },
                { key: 'password', val: 'demo1234' },
              ].map(({ key, val }) => (
                <div key={key} style={{ display: 'flex', gap: 8, fontSize: 11, color: '#666', marginBottom: 3 }}>
                  <span style={{ width: 70, color: '#888' }}>{key}</span>
                  <span style={{ fontFamily: 'monospace', color: '#534AB7' }}>{val}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Register form */}
        {tab === 'register' && (
          <>
            <Field label="Display Project Name" value={regName}    placeholder="Your full project name" onChange={setRegName}    onClear={() => { clearError(); setLocalError(null) }} />
            <Field label="Username"         value={regUser}    placeholder="Choose a username"   onChange={setRegUser}    onClear={() => { clearError(); setLocalError(null) }} />
            <Field label="Password"         type="password" value={regPass}    placeholder="Min. 6 characters"  onChange={setRegPass}    onClear={() => { clearError(); setLocalError(null) }} />
            <Field label="Confirm Password" type="password" value={regConfirm} placeholder="Repeat password"    onChange={setRegConfirm} onClear={() => { clearError(); setLocalError(null) }} />

            <button
              onClick={handleRegister}
              disabled={submitting}
              style={{
                width: '100%',
                background: '#534AB7',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: 12,
                fontSize: 13,
                fontWeight: 500,
                cursor: submitting ? 'not-allowed' : 'pointer',
                marginTop: 8,
                opacity: submitting ? 0.6 : 1,
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#3C3489' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#534AB7' }}
            >
              Create account
            </button>
          </>
        )}
      </div>
    </div>
  )
}
