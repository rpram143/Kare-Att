import { useState, useEffect } from 'react'
import { getBase, MARKS_API } from './api'

export default function MarksTab() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

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
    <div style={{ padding:16, paddingBottom:'calc(16px + var(--safe-bottom))' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
        <div className="stat-card slide-up d1 cyan">
          <div className="stat-label">Enrolled</div>
          <div className="stat-value">{loading ? '…' : marks.length}</div>
          <div className="stat-sub">subjects</div>
        </div>
        <div className="stat-card slide-up d2 indigo">
          <div className="stat-label">Source</div>
          <div className="stat-value" style={{ fontSize:18 }}>Portal</div>
          <div className="stat-sub">KARE SIS</div>
        </div>
      </div>

      <div className="section-hd">
        <span className="section-title">Subjects</span>
        <span className="section-badge">{marks.length} enrolled</span>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
        {loading && <div className="empty-state"><div className="empty-text">Loading…</div></div>}
        {error   && <div className="empty-state"><div className="empty-text">Could not load. Check proxy.</div></div>}
        {!loading && !error && marks.length === 0 && <div className="empty-state"><div className="empty-text">No marks data found.</div></div>}
        {marks.map((m, i) => (
          <div key={i} className={`slide-up d${Math.min(i+1,8)}`} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:8 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>{m.name}</div>
                {m.code && <div style={{ fontSize:10, fontFamily:'var(--mono)', color:'var(--text-2)', marginTop:2 }}>{m.code}</div>}
              </div>
              <div style={{ background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:10, padding:'0 10px', height:36, display:'grid', placeItems:'center', fontSize:10, fontFamily:'var(--mono)', color:'var(--text-2)', flexShrink:0 }}>
                Enrolled
              </div>
            </div>
            <div style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--text-3)' }}>
              Open portal to view detailed exam scores →
            </div>
          </div>
        ))}
      </div>

      <button className="btn-refresh" onClick={load}>
        <span className={loading ? 'spin' : ''}>↻</span>
        <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
      </button>
      {data?.fetchedAt && <div className="last-updated">Updated {new Date(data.fetchedAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</div>}
    </div>
  )
}
