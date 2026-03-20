import { useState, useEffect } from 'react'
import { getBase, MARKS_API, saveJar } from './api'
import { motion } from 'framer-motion'

export default function MarksTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true); setError(false)
    try {
      const resp = await fetch(`${getBase()}${MARKS_API}?draw=1&start=0&length=100`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json',
          'X-Cookie-Jar': localStorage.getItem('sis_jar') || '{}'
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

  return (
    <div style={{ padding: 20 }}>
      {/* Background Decor */}
      <div className="bg-orbs">
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div className="stat-card slide-up d1 cyan">
          <div className="stat-label">Enrolled</div>
          <div className="stat-value">{loading ? '…' : marks.length}</div>
          <div className="stat-sub">Subjects</div>
        </div>
        <div className="stat-card slide-up d2 indigo">
          <div className="stat-label">Current Sem</div>
          <div className="stat-value" style={{ fontSize: 24 }}>2024</div>
          <div className="stat-sub">Winter</div>
        </div>
      </div>

      <div className="section-hd">
        <span className="section-title">Course Enrollment</span>
        <span className="section-badge">{marks.length} Total</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <div className="empty-state"><div className="empty-text">Loading enrolled courses…</div></div>}
        {error && <div className="empty-state"><div className="empty-text">Could not load. Check proxy.</div></div>}
        {!loading && !error && marks.length === 0 && <div className="empty-state"><div className="empty-text">No courses found for this semester.</div></div>}

        {marks.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card"
            style={{ padding: 18 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1.4 }}>{m.name}</h3>
                <p style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: 4 }}>{m.code}</p>
              </div>
              <div className="section-badge" style={{ flexShrink: 0, background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                Active
              </div>
            </div>

            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Internal Marks</span>
              <span style={{ fontSize: 11, color: 'var(--accent-light)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>View Details →</span>
            </div>
          </motion.div>
        ))}
      </div>

      <button className="btn-refresh" onClick={load} style={{ marginTop: 24, position: 'relative', zIndex: 1 }}>
        <span className={loading ? 'spin' : ''}>↻</span>
        <span>{loading ? 'Refreshing Courses…' : 'Sync Courses'}</span>
      </button>

      {data?.fetchedAt && <div className="last-updated">Last sync: {new Date(data.fetchedAt).toLocaleTimeString()}</div>}
    </div>
  )
}
