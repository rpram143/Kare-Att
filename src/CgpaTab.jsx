import { useState, useEffect } from 'react'
import { getBase, GRADE_PAGE, gradeColor, saveJar } from './api'
import { motion } from 'framer-motion'

function parseCgpaHtml(doc) {
  let cgpa = null, earnedCredits = null, arrears = null
  const sTable = doc.querySelector('#s-table')
  if (sTable) {
    const row = sTable.querySelector('tbody tr')
    if (row) {
      const cells = [...row.querySelectorAll('td')].map(c => c.textContent.trim())
      cgpa = cells[0] || null
      earnedCredits = cells[1] || null
      arrears = cells[2] || null
    }
  }
  const semMap = {}
  doc.querySelectorAll('table').forEach(table => {
    if (table.id === 's-table') return
    const headers = [...table.querySelectorAll('thead th')].map(th => th.textContent.trim().toLowerCase())
    if (!headers.some(h => h.includes('semester')) || !headers.some(h => h.includes('grade'))) return
    table.querySelectorAll('tbody tr').forEach(row => {
      const cells = [...row.querySelectorAll('td')].map(c => c.textContent.trim())
      if (cells.length < 6) return
      const [semNum, code, name, credits, , grade] = cells
      const year = cells[7] || ''
      if (!semNum || !name) return
      const key = `Semester ${semNum}`
      if (!semMap[key]) semMap[key] = { sem: key, year, subjects: [] }
      semMap[key].subjects.push({ name, code, credits, grade })
      if (year && !semMap[key].year) semMap[key].year = year
    })
  })
  const semesters = Object.values(semMap).sort((a, b) =>
    parseInt(a.sem.replace('Semester ', '')) - parseInt(b.sem.replace('Semester ', '')))
  return { cgpa, earnedCredits, arrears, semesters }
}

export default function CgpaTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const resp = await fetch(`${getBase()}${GRADE_PAGE}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'text/html,*/*',
          'X-Cookie-Jar': localStorage.getItem('sis_jar') || '{}'
        }
      })
      saveJar(resp)
      const html = await resp.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const result = { ...parseCgpaHtml(doc), fetchedAt: Date.now() }
      localStorage.setItem('sis_cgpa_cache', JSON.stringify(result))
      setData(result)
    } catch {
      const c = localStorage.getItem('sis_cgpa_cache')
      if (c) setData(JSON.parse(c))
    } finally { setLoading(false) }
  }

  const { cgpa, earnedCredits, arrears, semesters = [], fetchedAt } = data || {}

  return (
    <div style={{ padding: 20 }}>
      {/* Background Decor */}
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="bg-grid" />
      </div>

      {/* CGPA Hero Widget */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card"
        style={{
          textAlign: 'center',
          marginBottom: 24,
          padding: '40px 24px',
          background: 'linear-gradient(145deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))',
          boxShadow: '0 0 40px rgba(99,102,241,0.1) inset'
        }}
      >
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: 12 }}>Cumulative Score</div>
        <div style={{
          fontSize: 72,
          fontWeight: 900,
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.05em',
          background: 'linear-gradient(to bottom, #ffffff, #a5b4fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1
        }}>
          {loading ? '…' : (cgpa || '0.0')}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 24 }}>
          {earnedCredits && <span className="pill present" style={{ padding: '6px 12px' }}>{earnedCredits} Credits</span>}
          {arrears !== null && (
            <span className={`pill ${parseInt(arrears) > 0 ? 'absent' : ''}`} style={{ padding: '6px 12px' }}>
              {arrears} Arrears
            </span>
          )}
        </div>
      </motion.div>

      <div className="section-hd">
        <span className="section-title">Academic History</span>
        <span className="section-badge">{semesters.length} Semesters</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!loading && semesters.length === 0 && <div className="empty-state"><div className="empty-text">No academic records found.</div></div>}

        {semesters.map((sem, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card"
            style={{ padding: 18 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{sem.sem}</h3>
                {sem.year && <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: 2 }}>{sem.year}</div>}
              </div>
              <span className="section-badge" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>{sem.subjects.length} courses</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {sem.subjects.map((s, j) => (
                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: j === 0 ? 'none' : '1px solid var(--border)', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{s.code}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {s.credits && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{s.credits}cr</span>}
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 14,
                      fontWeight: 800,
                      color: gradeColor(s.grade),
                      minWidth: 24,
                      textAlign: 'right'
                    }}>
                      {s.grade || '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <button className="btn-refresh" onClick={load} style={{ marginTop: 24, position: 'relative', zIndex: 1 }}>
        <span className={loading ? 'spin' : ''}>↻</span>
        <span>{loading ? 'Refreshing History…' : 'Sync History'}</span>
      </button>

      {fetchedAt && <div className="last-updated">Last sync: {new Date(fetchedAt).toLocaleTimeString()}</div>}
    </div>
  )
}
