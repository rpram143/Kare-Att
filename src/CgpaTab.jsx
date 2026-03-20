import { useState, useEffect } from 'react'
import { getBase, GRADE_PAGE, gradeColor, saveJar } from './api'

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
  const semesters = Object.values(semMap).sort((a,b) =>
    parseInt(a.sem.replace('Semester ','')) - parseInt(b.sem.replace('Semester ','')))
  return { cgpa, earnedCredits, arrears, semesters }
}

export default function CgpaTab() {
  const [data,    setData]    = useState(null)
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
      const doc  = new DOMParser().parseFromString(html, 'text/html')
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
    <div style={{ padding:16, paddingBottom:'calc(16px + var(--safe-bottom))' }}>
      {/* CGPA Hero */}
      <div style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))', border:'1px solid rgba(99,102,241,0.25)', borderRadius:20, padding:'28px 24px', marginBottom:16, textAlign:'center' }}>
        <div style={{ fontSize:11, fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-2)', marginBottom:6 }}>Cumulative GPA</div>
        <div style={{ fontSize:60, fontWeight:700, fontFamily:'var(--mono)', letterSpacing:'-0.04em', background:'linear-gradient(135deg,var(--accent2),#c4b5fd)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', lineHeight:1.1 }}>
          {loading ? '…' : (cgpa || '—')}
        </div>
        <div style={{ fontSize:12, color:'var(--text-2)', marginTop:8, fontFamily:'var(--mono)' }}>
          {earnedCredits ? `${earnedCredits} credits earned across ${semesters.length} semesters` : `${semesters.length} semesters`}
        </div>
        <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:12, flexWrap:'wrap' }}>
          {earnedCredits && (
            <span style={{ fontSize:11, fontFamily:'var(--mono)', padding:'4px 12px', borderRadius:99, border:'1px solid rgba(52,211,153,0.3)', color:'var(--green)', background:'var(--green-soft)' }}>
              {earnedCredits} credits
            </span>
          )}
          {arrears !== null && (
            <span style={{ fontSize:11, fontFamily:'var(--mono)', padding:'4px 12px', borderRadius:99, border:`1px solid ${parseInt(arrears)>0 ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`, color:parseInt(arrears)>0 ? 'var(--red)' : 'var(--text-2)', background:parseInt(arrears)>0 ? 'var(--red-soft)' : 'rgba(255,255,255,0.05)' }}>
              {arrears} arrear{arrears !== '1' ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="section-hd">
        <span className="section-title">Grade History</span>
        <span className="section-badge">{semesters.length} sems</span>
      </div>

      {!loading && semesters.length === 0 && <div className="empty-state"><div className="empty-text">No grade history found.</div></div>}

      {semesters.map((sem, i) => (
        <div key={i} className={`slide-up d${Math.min(i+1,8)}`} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:16, marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700 }}>{sem.sem}</div>
              {sem.year && <div style={{ fontSize:10, fontFamily:'var(--mono)', color:'var(--text-3)', marginTop:2 }}>{sem.year}</div>}
            </div>
            <span style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--text-2)' }}>{sem.subjects.length} subjects</span>
          </div>
          {sem.subjects.map((s, j) => (
            <div key={j} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderTop: j===0 ? 'none' : '1px solid var(--border)', gap:8 }}>
              <span style={{ fontSize:12, color:'var(--text-2)', flex:1, minWidth:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.name}</span>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                {s.credits && <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-3)' }}>{s.credits}cr</span>}
                <span style={{ fontFamily:'var(--mono)', fontSize:12, fontWeight:700, color:gradeColor(s.grade) }}>{s.grade || '—'}</span>
              </div>
            </div>
          ))}
        </div>
      ))}

      <button className="btn-refresh" onClick={load}>
        <span className={loading ? 'spin' : ''}>↻</span>
        <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
      </button>
      {fetchedAt && <div className="last-updated">Updated {new Date(fetchedAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</div>}
    </div>
  )
}
