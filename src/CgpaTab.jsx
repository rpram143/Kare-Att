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

export default function CgpaTab({ refreshKey }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [refreshKey])

  const load = async () => {
    setLoading(true)
    try {
      const jarStr = localStorage.getItem('sis_jar') || '{}';
      let xsrf = "";
      try {
        const jar = JSON.parse(jarStr);
        if (jar['XSRF-TOKEN']) xsrf = decodeURIComponent(jar['XSRF-TOKEN']);
      } catch (e) { }

      const resp = await fetch(`${getBase()}${GRADE_PAGE}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'text/html,*/*',
          'X-Cookie-Jar': jarStr,
          'X-XSRF-TOKEN': xsrf
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
    <div style={{ padding: '0 0 24px' }}>
      {/* CGPA Hero Widget */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="hero-card slide-up d1"
        style={{
          textAlign: 'center',
          marginBottom: 32,
          padding: '48px 24px'
        }}
      >
        <div className="stat-label" style={{ marginBottom: 12 }}>Cumulative Grade Index</div>
        <div style={{
          fontSize: 80,
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.04em',
          color: 'var(--primary)',
          lineHeight: 1
        }}>
          {loading ? '…' : (cgpa || '0.0')}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 32 }}>
          {earnedCredits && <span className="pill pill-success" style={{ padding: '8px 16px' }}>{earnedCredits} CREDITS EARNED</span>}
          {arrears !== null && (
            <span className={`pill ${parseInt(arrears) > 0 ? 'pill-error' : 'pill-success'}`} style={{ padding: '8px 16px' }}>
              {arrears} ARREARS
            </span>
          )}
        </div>
      </motion.div>

      <div className="section-hd" style={{ padding: '0 4px', marginBottom: 20 }}>
        <h2 className="display-txt" style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Academic Chronology</h2>
        <div style={{ width: 40, height: 1, background: 'var(--border)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {!loading && semesters.length === 0 && (
          <div className="text-center" style={{ padding: '60px 20px', opacity: 0.5 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>No academic chronology retrieved.</p>
          </div>
        )}

        {semesters.map((sem, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 + 0.3 }}
            style={{ position: 'relative', paddingLeft: 24 }}
          >
            {/* Timeline Line */}
            <div style={{
              position: 'absolute',
              left: 0, top: 0, bottom: 0,
              width: 2,
              background: 'linear-gradient(to bottom, var(--primary), transparent)',
              opacity: 0.3
            }} />
            <div style={{
              position: 'absolute',
              left: -3, top: 0,
              width: 8, height: 8,
              borderRadius: '50%',
              background: 'var(--primary)',
              boxShadow: '0 0 10px var(--primary-glow)'
            }} />

            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h3 className="display-txt" style={{ fontSize: 18, color: 'var(--text-main)', marginBottom: 4 }}>{sem.sem.toUpperCase()}</h3>
                  {sem.year && <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{sem.year}</div>}
                </div>
                <div className="pill" style={{ background: 'var(--surface-hi)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  {sem.subjects.length} COURSES
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sem.subjects.map((s, j) => (
                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                      <code style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.7 }}>{s.code}</code>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                      {s.credits && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{s.credits} CR</div>}
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 18,
                        fontWeight: 800,
                        color: gradeColor(s.grade) || 'var(--text-main)',
                        minWidth: 28,
                        textAlign: 'right'
                      }}>
                        {s.grade || '—'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
