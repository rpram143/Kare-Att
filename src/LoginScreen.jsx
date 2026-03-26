import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getBase, LOGIN_PATH } from './api'
import Logo from './Logo'

export default function LoginScreen({ onLogin }) {
  const [regNo, setRegNo] = useState(localStorage.getItem('sis_reg') || '')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showProxy, setShowProxy] = useState(false)
  const [proxyUrl, setProxyUrl] = useState(localStorage.getItem('sis_proxy') || '')

  useEffect(() => {
    localStorage.removeItem('sis_pass')
  }, [])

  const doLogin = async () => {
    if (!regNo || !pass) { setError('Enter your register number and password.'); return }
    setError(''); setLoading(true)
    try {
      const base = getBase();
      const loginUrl = base + LOGIN_PATH;

      // Step 1: GET /login to establish session and get XSRF token
      const prepResp = await fetch(loginUrl, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-Cookie-Jar': localStorage.getItem('sis_jar') || '{}'
        }
      });
      const prepJarStr = prepResp.headers.get('X-Cookie-Jar');
      if (prepJarStr) localStorage.setItem('sis_jar', prepJarStr);

      // Attempt to extract XSRF token from the jar for standard POST CSRF protection
      let xsrf = "";
      try {
        const jar = JSON.parse(localStorage.getItem('sis_jar') || '{}');
        if (jar['XSRF-TOKEN']) xsrf = decodeURIComponent(jar['XSRF-TOKEN']);
      } catch (e) { /* Best effort: proceed without token if parsing fails */ }

      // Step 2: POST credentials with the session cookie
      const resp = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Cookie-Jar': localStorage.getItem('sis_jar') || '{}',
          'X-XSRF-TOKEN': xsrf
        },
        body: new URLSearchParams({ register_no: regNo, password: pass }).toString(),
      })

      const newJar = resp.headers.get('X-Cookie-Jar');
      if (newJar) localStorage.setItem('sis_jar', newJar);

      const html = await resp.text()
      if (!resp.ok) {
        throw new Error('SIS connection failed. (HTTP ' + resp.status + ')')
      }

      const doc = new DOMParser().parseFromString(html, 'text/html')
      const hasLoginForm =
        !!doc.querySelector('form[action*="/login"], input[name="register_no"], input[name="password"]')
      const authError =
        doc.querySelector('.alert-danger, .invalid-feedback, .error, .help-block.text-danger')?.textContent?.trim() || ''
      const nameEl = doc.querySelector('.navbar-right li a, nav .dropdown-toggle, .user-panel .info p')

      if (hasLoginForm && !nameEl) {
        throw new Error(authError || 'Invalid register number or password.')
      }

      if (!nameEl) {
        throw new Error('Login succeeded, but the SIS home page could not be verified.')
      }

      localStorage.setItem('sis_reg', regNo)
      onLogin(html)
    } catch (err) {
      setError(err.message || 'Login failed. Check your network or proxy.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      {/* Proxy Settings Trigger */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={() => setShowProxy(true)}
        style={{
          position: 'absolute',
          top: 'calc(24px + var(--safe-top))',
          right: 24,
          width: 44,
          height: 44,
          borderRadius: 14,
          background: 'var(--surface-hi)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          zIndex: 10,
          backdropFilter: 'blur(10px)'
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}
      >
        <div className="glass-card" style={{ padding: '48px 32px' }}>
          <div className="text-center" style={{ marginBottom: 48 }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Logo size={80} />
            </motion.div>
            <div style={{ marginTop: 24 }}>
              <h1 className="display-txt" style={{ fontSize: 32, color: 'var(--text-main)' }}>KARE-ATT</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, fontWeight: 500, letterSpacing: '0.01em' }}>Premium Student Dashboard</p>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Registry Identifier</label>
            <input
              className="field-input"
              placeholder="Enter your registration number"
              type="text"
              value={regNo}
              onChange={e => setRegNo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doLogin()}
            />
          </div>

          <div className="field-group" style={{ marginBottom: 40 }}>
            <label className="field-label">Security Access Key</label>
            <input
              className="field-input"
              type="password"
              placeholder="••••••••••••"
              value={pass}
              onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doLogin()}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="pill-error"
              style={{ padding: 16, borderRadius: 12, marginBottom: 24, textAlign: 'center', fontWeight: 600, border: '1px solid rgba(255,180,171,0.2)' }}
            >
              {error}
            </motion.div>
          )}

          <button className="btn-primary" onClick={doLogin} disabled={loading} style={{ position: 'relative', height: 60 }}>
            <span style={{ opacity: loading ? 0 : 1 }}>AUTHORIZE ACCESS</span>
            {loading && (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                <span className="loader" style={{ width: 24, height: 24 }} />
              </div>
            )}
          </button>
        </div>

        <div className="text-center" style={{ marginTop: 40, opacity: 0.4 }}>
          <p style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>Intelligent Student Companion v2.0</p>
        </div>
      </motion.div>

      <AnimatePresence>
        {showProxy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              background: 'rgba(1, 14, 36, 0.8)',
              backdropFilter: 'blur(20px)'
            }}
            onClick={e => e.target === e.currentTarget && setShowProxy(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card"
              style={{ width: '100%', maxWidth: 400 }}
            >
              <h3 className="display-txt" style={{ color: 'var(--text-main)', marginBottom: 12, fontSize: 20 }}>System Proxy</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>Adjust the gateway URL if you are experiencing connectivity interruptions with the institutional server.</p>

              <div className="field-group">
                <label className="field-label">Gateway URL</label>
                <input
                  className="field-input"
                  placeholder="https://proxy.example.com"
                  value={proxyUrl}
                  onChange={e => {
                    setProxyUrl(e.target.value)
                    localStorage.setItem('sis_proxy', e.target.value)
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                <button className="btn-primary" onClick={() => setShowProxy(false)}>
                  COMPLETE CONFIGURATION
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
