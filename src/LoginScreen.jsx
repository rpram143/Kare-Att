import { useState } from 'react'
import { getBase, LOGIN_PATH, ATTEND_API } from './api'

const GradCapIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
)

export default function LoginScreen({ onLogin }) {
  const [regNo,   setRegNo]   = useState(localStorage.getItem('sis_reg') || '')
  const [pass,    setPass]    = useState(localStorage.getItem('sis_pass') ? atob(localStorage.getItem('sis_pass')) : '')
  const [save,    setSave]    = useState(true)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showProxy, setShowProxy] = useState(false)
  const [proxyUrl,  setProxyUrl]  = useState(localStorage.getItem('sis_proxy') || '')

  const saveProxy = () => {
    const val = proxyUrl.trim().replace(/\/$/, '')
    localStorage.setItem('sis_proxy', val)
    setShowProxy(false)
  }

  const doLogin = async () => {
    if (!regNo || !pass) { setError('Enter your register number and password.'); return }
    setError(''); setLoading(true)
    try {
      const resp = await fetch(getBase() + LOGIN_PATH, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Cookie-Jar': localStorage.getItem('sis_jar') || '{}'
        },
        body: new URLSearchParams({ register_no: regNo, password: pass }).toString(),
      })
      
      const newJar = resp.headers.get('X-Cookie-Jar');
      if (newJar) localStorage.setItem('sis_jar', newJar);

      const html = await resp.text()
      if (html.includes('Login - SIS') || html.includes('Invalid') || html.includes('incorrect'))
        throw new Error('Invalid register number or password.')

      const doc  = new DOMParser().parseFromString(html, 'text/html')
      const nEl  = doc.querySelector('.navbar-right li a, nav .dropdown-toggle, .user-panel .info p')
      const name = nEl ? nEl.textContent.trim().replace(/\s+/g, ' ') : regNo

      if (save) {
        localStorage.setItem('sis_reg',  regNo)
        localStorage.setItem('sis_pass', btoa(pass))
        localStorage.setItem('sis_name', name)
      }

      const attResp = await fetch(`${getBase()}${ATTEND_API}?draw=1&start=0&length=100`, {
        headers: { 
          'X-Requested-With': 'XMLHttpRequest', 
          Accept: 'application/json',
          'X-Cookie-Jar': localStorage.getItem('sis_jar')
        }
      })
      
      const attJar = attResp.headers.get('X-Cookie-Jar');
      if (attJar) localStorage.setItem('sis_jar', attJar);

      const json = await attResp.json()
      const subjects = (json.data || []).map(r => ({
        name: r.course_name, code: r.course_code,
        present: parseInt(r.present) || 0,
        total:   parseInt(r.total)   || 0,
        pct:     parseFloat(r.percentage) || 0,
      })).filter(s => s.name && s.total > 0)

      const attData = { subjects, fetchedAt: Date.now() }
      localStorage.setItem('sis_att_cache', JSON.stringify(attData))
      onLogin(name, attData)
    } catch (err) {
      console.error('Full Login Error:', err);
      setError(`${err.message} (Check proxy console)`);
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100svh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 20px', paddingTop:'calc(24px + var(--safe-top))', position:'relative', zIndex:1 }}>
      <div style={{ width:'100%', maxWidth:380, animation:'slideUp 0.5s cubic-bezier(.16,1,.3,1) both' }}>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:36 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,var(--accent),#8b5cf6)', display:'grid', placeItems:'center', boxShadow:'0 0 24px var(--accent-glow)' }}>
            <GradCapIcon />
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.02em' }}>KARE SIS</div>
            <div style={{ fontSize:11, color:'var(--text-2)', fontFamily:'var(--mono)', letterSpacing:'0.05em' }}>student portal</div>
          </div>
        </div>

        <h1 style={{ fontSize:28, fontWeight:700, letterSpacing:'-0.03em', marginBottom:6 }}>Welcome back</h1>
        <p style={{ fontSize:13, color:'var(--text-2)', marginBottom:32 }}>Sign in to track attendance, marks &amp; CGPA.</p>

        <div className="glass-card">
          <div className="field">
            <label className="field-label">Register Number</label>
            <input className="field-input" type="text" placeholder="e.g. 9924008118"
              value={regNo} onChange={e => setRegNo(e.target.value)} autoComplete="username" />
          </div>
          <div className="field">
            <label className="field-label">Password</label>
            <input className="field-input" type="password" placeholder="••••••••"
              value={pass} onChange={e => setPass(e.target.value)}
              autoComplete="current-password"
              onKeyDown={e => e.key === 'Enter' && doLogin()} />
          </div>

          <div className="toggle-wrap">
            <label className="toggle">
              <input type="checkbox" checked={save} onChange={e => setSave(e.target.checked)} />
              <span className="toggle-track" />
            </label>
            <span className="toggle-label">Remember me on this device</span>
          </div>

          <button className="btn-primary" onClick={doLogin} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          {error && (
            <div style={{ background:'var(--red-soft)', border:'1px solid rgba(248,113,113,0.25)', borderRadius:10, padding:'10px 14px', fontSize:12, fontFamily:'var(--mono)', color:'var(--red)', marginTop:14 }}>
              {error}
            </div>
          )}
        </div>

        <p style={{ textAlign:'center', marginTop:20, fontSize:11, fontFamily:'var(--mono)', color:'var(--text-3)' }}>
          Need proxy?{' '}
          <span style={{ color:'var(--accent2)', cursor:'pointer' }} onClick={() => setShowProxy(true)}>
            Setup guide →
          </span>
        </p>
      </div>

      {showProxy && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowProxy(false)}>
          <div className="modal">
            <div className="modal-handle" />
            <h3>Proxy Setup</h3>
            <p>Run in terminal and keep open while using the app:</p>
            <code>node proxy.js</code>
            <div className="field">
              <label className="field-label">Proxy Base URL</label>
              <input className="field-input" placeholder="http://192.168.x.x:8010"
                value={proxyUrl} onChange={e => setProxyUrl(e.target.value)} />
            </div>
            <div className="modal-btns">
              <button className="btn-ghost" onClick={() => setShowProxy(false)}>Cancel</button>
              <button className="btn-solid" onClick={saveProxy}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
