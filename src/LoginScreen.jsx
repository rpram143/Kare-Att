import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>

      {/* Background Decor */}
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="bg-grid" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}
      >
        <div className="glass-card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 40 }}>
            <Logo size={70} />
            <div style={{ marginTop: 16 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: 'white' }}>KARE-ATT</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>Student Academic Companion</p>
            </div>
          </div>

          <div className="field">
            <label className="field-label">Registration Number</label>
            <input
              className="field-input"
              placeholder="e.g. 992400xxxx"
              value={regNo}
              onChange={e => setRegNo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doLogin()}
            />
          </div>

          <div className="field" style={{ marginBottom: 30 }}>
            <label className="field-label">Password</label>
            <input
              className="field-input"
              type="password"
              placeholder="••••••••"
              value={pass}
              onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doLogin()}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ color: 'var(--red)', fontSize: 12, background: 'var(--red-soft)', padding: 12, borderRadius: 10, marginBottom: 20, textAlign: 'center', fontWeight: 600, border: '1px solid rgba(239,68,68,0.2)' }}
            >
              {error}
            </motion.div>
          )}

          <button className="btn-primary" onClick={doLogin} disabled={loading} style={{ position: 'relative', overflow: 'hidden' }}>
            <span style={{ opacity: loading ? 0 : 1 }}>Sign In</span>
            {loading && (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                <span className="spin">↻</span>
              </div>
            )}
          </button>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Connection issues?{' '}
              <span
                style={{ color: 'var(--accent-light)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                onClick={() => setShowProxy(true)}
              >
                Configure Proxy
              </span>
            </span>
          </div>
        </div>

        <div style={{ marginTop: 32, textAlign: 'center', opacity: 0.5 }}>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Powered by KARE SIS Data</p>
        </div>
      </motion.div>

      {showProxy && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowProxy(false)}>
          <div className="modal">
            <div className="modal-handle" />
            <h3 style={{ color: 'white' }}>Proxy Configuration</h3>
            <p>If you cannot log in, ensure your local proxy server is running and the URL below matches.</p>
            <code>npm start</code>

            <div className="field" style={{ marginTop: 20 }}>
              <label className="field-label">Proxy Base URL</label>
              <input
                className="field-input"
                placeholder="http://localhost:8010"
                value={proxyUrl}
                onChange={e => {
                  setProxyUrl(e.target.value)
                  localStorage.setItem('sis_proxy', e.target.value)
                }}
              />
            </div>

            <button className="btn-primary" onClick={() => setShowProxy(false)} style={{ marginTop: 10 }}>
              Save & Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
