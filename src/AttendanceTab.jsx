import { useState, useEffect } from 'react'
import { getBase, ATTEND_API, MIN_ATT, attClass, saveJar } from './api'
import { motion } from 'framer-motion'

const BarFill = ({ pct, cls }) => (
  <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10, width: '100%', overflow: 'hidden', marginTop: 10 }}>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${pct}%` }}
      transition={{ duration: 1, ease: "easeOut" }}
      style={{ height: '100%', borderRadius: 10, background: cls === 'good' ? 'var(--green)' : cls === 'warn' ? 'var(--amber)' : 'var(--red)' }}
    />
  </div>
)

export default function AttendanceTab({ initData }) {
  const [data, setData] = useState(initData)
  const [loading, setLoading] = useState(!initData)

  const load = async () => {
    setLoading(true)
    try {
      const resp = await fetch(`${getBase()}${ATTEND_API}?draw=1&start=0&length=100`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json',
          'X-Cookie-Jar': localStorage.getItem('sis_jar') || '{}'
        }
      })
      saveJar(resp)
      const json = await resp.json()
      const subjects = (json.data || []).map(r => ({
        name: r.course_name, code: r.course_code,
        present: parseInt(r.present) || 0,
        total: parseInt(r.total) || 0,
        pct: parseFloat(r.percentage) || 0,
      })).filter(s => s.name && s.total > 0)

      const result = { subjects, fetchedAt: Date.now() }
      localStorage.setItem('sis_att_cache', JSON.stringify(result))
      setData(result)
    } catch {
      const c = localStorage.getItem('sis_att_cache')
      if (c) setData(JSON.parse(c))
    } finally { setLoading(false) }
  }

  useEffect(() => { if (!initData) load() }, [])

  const { subjects = [], fetchedAt } = data || {}
  const totalP = subjects.reduce((a, b) => a + b.present, 0)
  const totalT = subjects.reduce((a, b) => a + b.total, 0)
  const overall = totalT ? ((totalP / totalT) * 100).toFixed(1) : 0

  return (
    <div style={{ padding: 20 }}>
      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div className={`stat-card slide-up d1 ${overall >= MIN_ATT ? 'green' : 'red'}`}>
          <div className="stat-label">Overall %</div>
          <div className="stat-value">{loading ? '…' : overall}</div>
          <div className="stat-sub">{overall >= MIN_ATT ? 'Safe' : 'Below 75%'}</div>
        </div>
        <div className="stat-card slide-up d2 indigo">
          <div className="stat-label">Total Subjects</div>
          <div className="stat-value">{loading ? '…' : subjects.length}</div>
          <div className="stat-sub">Semester 2024</div>
        </div>
      </div>

      <div className="section-hd">
        <span className="section-title">Academic Courses</span>
        <span className="section-badge">{subjects.length} Subjects</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!loading && subjects.length === 0 && <div className="empty-state"><div className="empty-text">No attendance data found.</div></div>}

        {subjects.map((s, i) => {
          const cls = attClass(s.pct)
          const absent = s.total - s.present

          let marginText = "", marginColor = "var(--text-muted)", marginIcon = "ⓘ";
          if (s.pct >= MIN_ATT) {
            const maxBunk = Math.floor(s.present / 0.75 - s.total);
            if (maxBunk > 0) {
              marginText = `Safe: Bunk ${maxBunk} classes`;
              marginColor = "var(--green)";
              marginIcon = "✓";
            } else {
              marginText = "Critical: Don't bunk!";
              marginColor = "var(--amber)";
              marginIcon = "⚠";
            }
          } else {
            const req = 3 * s.total - 4 * s.present;
            marginText = `Required: Attend ${req} classes`;
            marginColor = "var(--red)";
            marginIcon = "✕";
          }

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card"
              style={{ padding: 18, borderLeft: `4px solid ${cls === 'good' ? 'var(--green)' : cls === 'warn' ? 'var(--amber)' : 'var(--red)'}` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1.4, marginBottom: 4 }}>{s.name}</h3>
                  <p style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{s.code}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'white', lineHeight: 1 }}>{s.pct}%</div>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginTop: 4 }}>Attendance</div>
                </div>
              </div>

              <BarFill pct={s.pct} cls={cls} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="pill present">P: {s.present}</span>
                  <span className="pill absent">A: {absent}</span>
                  <span className="pill">T: {s.total}</span>
                </div>

                <div style={{
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${marginColor}33`,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span style={{ fontSize: 12, color: marginColor }}>{marginIcon}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: marginColor, fontFamily: 'var(--font-mono)' }}>{marginText}</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <button className="btn-refresh" onClick={load} style={{ marginTop: 24 }}>
        <span className={loading ? 'spin' : ''}>↻</span>
        <span>{loading ? 'Refreshing Attendance…' : 'Sync Attendance'}</span>
      </button>

      {fetchedAt && <div className="last-updated">Last sync: {new Date(fetchedAt).toLocaleTimeString()}</div>}
    </div>
  )
}
