import { useState, useEffect } from 'react'
import { getBase, MARKS_API, saveJar } from './api'
import { motion } from 'framer-motion'

export default function MarksTab({ refreshKey }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => { load() }, [refreshKey])

  const load = async () => {
    setLoading(true); setError(false)
    try {
      const jarStr = localStorage.getItem('sis_jar') || '{}';
      let xsrf = "";
      try {
        const jar = JSON.parse(jarStr);
        if (jar['XSRF-TOKEN']) xsrf = decodeURIComponent(jar['XSRF-TOKEN']);
      } catch (e) { }

      const resp = await fetch(`${getBase()}${MARKS_API}?draw=1&start=0&length=100`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json',
          'X-Cookie-Jar': jarStr,
          'X-XSRF-TOKEN': xsrf
        }
      })
      saveJar(resp)
      const json = await resp.json()
      const marks = (json.data || []).map(r => ({ name: r.course_name || '', code: r.course_code || '' })).filter(m => m.name)
      const result = { marks, fetchedAt: Date.now() }
      localStorage.setItem('sis_marks_cache', JSON.stringify(result))
      setData(result)
    } catch {
      const c = localStorage.getItem('sis_marks_cache')
      if (c) setData(JSON.parse(c))
      else setError(true)
    } finally { setLoading(false) }
  }

  const marks = data?.marks || []
  const syncedAt = data?.fetchedAt ? new Date(data.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Waiting'

  return (
    <div style={{ padding: '0 0 24px' }}>
      <div className="grid-2 slide-up d1" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-label">Registry Enrollment</div>
          <div className="stat-value">{loading ? '…' : marks.length}</div>
          <div className="item-sub" style={{ opacity: 0.6 }}>Active Courses</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">System State</div>
          <div className="stat-value" style={{ fontSize: 24, padding: '4px 0' }}>{loading ? '…' : syncedAt}</div>
          <div className="item-sub" style={{ opacity: 0.6 }}>Last Check-in</div>
        </div>
      </div>

      <div className="section-hd" style={{ padding: '0 4px', marginBottom: 20 }}>
        <h2 className="display-txt" style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Academic Ledger</h2>
        <div style={{ width: 40, height: 1, background: 'var(--border)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading && (
          <div className="text-center" style={{ padding: '60px 20px', opacity: 0.5 }}>
            <span className="loader" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>RETRIEVING ARCHIVAL DATA…</p>
          </div>
        )}
        {error && (
          <div className="pill-error text-center" style={{ padding: 24, borderRadius: 20 }}>
            <p style={{ fontWeight: 700 }}>SYNCHRONIZATION FAILURE</p>
            <p style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Check your network gateway status.</p>
          </div>
        )}
        {!loading && !error && marks.length === 0 && (
          <div className="text-center" style={{ padding: '60px 20px', opacity: 0.5 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>No course enrollment detected for this session.</p>
          </div>
        )}

        {marks.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 + 0.2 }}
            className="glass-card"
            style={{ padding: 20 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>{m.name}</h3>
                <code style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.8 }}>{m.code}</code>
              </div>
              <div className="pill pill-success" style={{ fontSize: 9 }}>STATUS: ACTIVE</div>
            </div>

            <div style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Internal Audit</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Performance Assessment</div>
              </div>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: 12,
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                INSIGHTS
                <div style={{ width: 12, height: 1, background: 'var(--primary)' }} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ padding: '0 4px', marginTop: 32 }}>
        <button className="btn-secondary" onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span className={loading ? 'loader' : ''} style={loading ? { width: 14, height: 14, borderWidth: 2 } : {}}>
            {!loading && '↻'}
          </span>
          <span>{loading ? 'ARCHIVING LIVE DATA…' : 'SYNCHRONIZE REGISTRY'}</span>
        </button>
      </div>

      {data?.fetchedAt && (
        <div className="text-center" style={{ marginTop: 24, opacity: 0.4 }}>
          <p style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
            LAST RETRIEVAL: {new Date(data.fetchedAt).toLocaleTimeString().toUpperCase()}
          </p>
        </div>
      )}
    </div>
  )
}
