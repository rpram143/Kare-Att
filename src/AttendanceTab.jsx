import { useState, useEffect } from 'react'
import { getBase, ATTEND_API, MIN_ATT, attClass, saveJar } from './api'
import { motion } from 'framer-motion'

const BarFill = ({ pct, cls }) => (
  <div style={{ position: 'relative', marginTop: 12 }}>
    <div style={{ height: 10, background: 'var(--surface-highest)', borderRadius: 12, width: '100%', overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
      {/* 75% Threshold Marker */}
      <div style={{
        position: 'absolute',
        left: '75%',
        top: 0,
        bottom: 0,
        width: 1,
        background: 'rgba(255,255,255,0.2)',
        zIndex: 2,
        borderLeft: '1px dashed rgba(255,255,255,0.4)'
      }} />

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          height: '100%',
          borderRadius: 12,
          background: cls === 'good' ? 'var(--success)' : cls === 'warn' ? 'var(--warning)' : 'var(--error)',
          boxShadow: `0 0 16px ${cls === 'good' ? 'var(--primary-glow)' : 'rgba(255,185,95,0.2)'}`
        }}
      />
    </div>
    <div style={{
      position: 'absolute',
      left: '75%',
      top: -14,
      fontSize: 8,
      fontWeight: 800,
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)',
      transform: 'translateX(-50%)',
      letterSpacing: '0.05em'
    }}>
      75% LIMIT
    </div>
  </div>
)

export default function AttendanceTab({ initData, refreshKey }) {
  const [data, setData] = useState(initData)
  const [loading, setLoading] = useState(!initData)

  const load = async () => {
    setLoading(true)
    try {
      const jarStr = localStorage.getItem('sis_jar') || '{}';
      let xsrf = "";
      try {
        const jar = JSON.parse(jarStr);
        if (jar['XSRF-TOKEN']) xsrf = decodeURIComponent(jar['XSRF-TOKEN']);
      } catch (e) { }

      const resp = await fetch(`${getBase()}${ATTEND_API}?draw=1&start=0&length=100`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json',
          'X-Cookie-Jar': jarStr,
          'X-XSRF-TOKEN': xsrf
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

  useEffect(() => {
    if (!initData || refreshKey > 0) load()
  }, [refreshKey])

  const { subjects = [], fetchedAt } = data || {}
  const totalP = subjects.reduce((a, b) => a + b.present, 0)
  const totalT = subjects.reduce((a, b) => a + b.total, 0)
  const overall = totalT ? ((totalP / totalT) * 100).toFixed(1) : 0

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* Hero Overview */}
      <div className="hero-card slide-up d1" style={{ marginBottom: 24, padding: '40px 24px' }}>
        <div className="stat-label">System-Wide Attendance</div>
        <div className="stat-value" style={{ fontSize: 56, color: 'var(--primary)', margin: '12px 0' }}>{loading ? '…' : overall}%</div>
        <div className={`pill ${overall >= MIN_ATT ? 'pill-success' : 'pill-error'}`} style={{ display: 'inline-block', fontSize: 13, padding: '8px 16px' }}>
          {loading ? 'CALCULATING…' : overall >= MIN_ATT ? 'REGISTRY STATUS: SAFE' : 'REGISTRY STATUS: CRITICAL'}
        </div>
      </div>

      <div className="grid-2 slide-up d2" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-label">Total Credits</div>
          <div className="stat-value">{loading ? '…' : subjects.length * 3}</div>
          <div className="item-sub" style={{ opacity: 0.6 }}>Estimated Load</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Courses</div>
          <div className="stat-value">{loading ? '…' : subjects.length}</div>
          <div className="item-sub" style={{ opacity: 0.6 }}>Current Semester</div>
        </div>
      </div>

      <div className="section-hd" style={{ padding: '0 4px', marginBottom: 20 }}>
        <h2 className="display-txt" style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Academic Folio</h2>
        <div style={{ width: 40, height: 1, background: 'var(--border)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!loading && subjects.length === 0 && (
          <div className="text-center" style={{ padding: '60px 20px', opacity: 0.5 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>No archival data retrieved for this session.</p>
          </div>
        )}

        {subjects.map((s, i) => {
          const cls = attClass(s.pct)
          const absent = s.total - s.present

          let insightLabel = "", insightColor = "var(--text-muted)", statusType = "pill-success";
          if (s.pct >= MIN_ATT) {
            const maxBunk = Math.floor(s.present / 0.75 - s.total);
            if (maxBunk > 0) {
              insightLabel = `Safe to forfeit ${maxBunk} sessions`;
              insightColor = "var(--primary)";
              statusType = "pill-success";
            } else {
              insightLabel = "Zero margin: Attend all sessions";
              insightColor = "var(--tertiary)";
              statusType = "pill-warning";
            }
          } else {
            const req = 3 * s.total - 4 * s.present;
            insightLabel = `Immediate: Attend ${req} sessions`;
            insightColor = "var(--error)";
            statusType = "pill-error";
          }

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 + 0.3 }}
              className="glass-card"
              style={{ padding: 20, borderLeft: `2px solid ${insightColor}` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>{s.name}</h3>
                  <code style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.8 }}>{s.code}</code>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="display-txt" style={{ fontSize: 24, color: 'var(--text-main)' }}>{s.pct}%</div>
                  <div className={`pill ${statusType}`} style={{ fontSize: 9, marginTop: 6 }}>{cls.toUpperCase()}</div>
                </div>
              </div>

              <BarFill pct={s.pct} cls={cls} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    P: <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{s.present}</span>
                  </div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    A: <span style={{ color: 'var(--error)', fontWeight: 700 }}>{absent}</span>
                  </div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    T: <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{s.total}</span>
                  </div>
                </div>

                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: insightColor,
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.01em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: insightColor }} />
                  {insightLabel}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div style={{ padding: '0 4px', marginTop: 32 }}>
        <button className="btn-secondary" onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span className={loading ? 'loader' : ''} style={loading ? { width: 14, height: 14, borderWidth: 2 } : {}}>
            {!loading && '↻'}
          </span>
          <span>{loading ? 'ARCHIVING LIVE DATA…' : 'SYNCHRONIZE REGISTRY'}</span>
        </button>
      </div>

      {fetchedAt && (
        <div className="text-center" style={{ marginTop: 24, opacity: 0.4 }}>
          <p style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
            LAST RETRIEVAL: {new Date(fetchedAt).toLocaleTimeString().toUpperCase()}
          </p>
        </div>
      )}
    </div>
  )
}
