import { useState, useEffect, useRef } from 'react'
import { getBase, ATTEND_API, MIN_ATT, attClass } from './api'

function BarFill({ pct, cls }) {
  const ref = useRef()
  useEffect(() => {
    const t = setTimeout(() => { if (ref.current) ref.current.style.width = pct + '%' }, 150)
    return () => clearTimeout(t)
  }, [pct])
  const colors = {
    good: 'linear-gradient(90deg,#059669,var(--green))',
    warn: 'linear-gradient(90deg,#d97706,var(--amber))',
    bad:  'linear-gradient(90deg,#dc2626,var(--red))'
  }
  return (
    <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:99, overflow:'hidden', marginBottom:8 }}>
      <div ref={ref} style={{ height:'100%', borderRadius:99, background:colors[cls], width:0, transition:'width 1s cubic-bezier(.16,1,.3,1)' }} />
    </div>
  )
}

export default function AttendanceTab({ initData }) {
  const [data,    setData]    = useState(initData)
  const [loading, setLoading] = useState(false)
  const [offline, setOffline] = useState(!navigator.onLine)

  const refresh = async () => {
    setLoading(true)
    try {
      const resp = await fetch(`${getBase()}${ATTEND_API}?draw=1&start=0&length=100`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' }
      })
      const json = await resp.json()
      const subjects = (json.data || []).map(r => ({
        name: r.course_name, code: r.course_code,
        present: parseInt(r.present) || 0,
        total:   parseInt(r.total)   || 0,
        pct:     parseFloat(r.percentage) || 0,
      })).filter(s => s.name && s.total > 0)
      const result = { subjects, fetchedAt: Date.now() }
      localStorage.setItem('sis_att_cache', JSON.stringify(result))
      setData(result); setOffline(false)
    } catch {
      const c = localStorage.getItem('sis_att_cache')
      if (c) { setData(JSON.parse(c)); setOffline(true) }
    } finally { setLoading(false) }
  }

  const { subjects = [], fetchedAt } = data || {}
  const overall = subjects.length ? Math.round(subjects.reduce((s,x) => s + x.pct, 0) / subjects.length) : 0
  const oClass  = overall >= 85 ? 'green' : overall >= MIN_ATT ? 'indigo' : 'red'

  let sClass = 'green', sVal = 'Safe', sSub = "You're good"
  if (overall < 85 && overall >= MIN_ATT) { sClass='amber'; sVal='OK';   sSub=`${overall - MIN_ATT}% margin` }
  if (overall < MIN_ATT)                  { sClass='red';   sVal='Risk'; sSub=`Below ${MIN_ATT}%` }

  const stripeColor = { good:'var(--green)', warn:'var(--amber)', bad:'var(--red)' }

  return (
    <div style={{ padding:16, paddingBottom:'calc(16px + var(--safe-bottom))' }}>
      {offline && <div className="offline-banner">Connection lost — showing cached data</div>}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
        <div className={`stat-card slide-up d1 ${oClass}`}>
          <div className="stat-label">Overall</div>
          <div className="stat-value">{overall}%</div>
          <div className="stat-sub">attendance</div>
        </div>
        <div className={`stat-card slide-up d2 ${sClass}`}>
          <div className="stat-label">Status</div>
          <div className="stat-value">{sVal}</div>
          <div className="stat-sub">{sSub}</div>
        </div>
      </div>

      <div className="section-hd">
        <span className="section-title">Subjects</span>
        <span className="section-badge">{subjects.length} subjects</span>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
        {subjects.length === 0 && <div className="empty-state"><div className="empty-text">No attendance data found.</div></div>}
        {subjects.map((s, i) => {
          const cls    = attClass(s.pct)
          const absent = s.total - s.present
          return (
            <div key={i} className={`slide-up d${Math.min(i+1,8)}`} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:16, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', left:0, top:16, bottom:16, width:3, borderRadius:'0 3px 3px 0', background:stripeColor[cls] }} />
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:10, paddingLeft:10 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:3 }}>{s.name}</div>
                  {s.code && <div style={{ fontSize:10, fontFamily:'var(--mono)', color:'var(--text-2)' }}>{s.code}</div>}
                </div>
                <div style={{ flexShrink:0, textAlign:'right' }}>
                  <div style={{ fontSize:22, fontWeight:700, fontFamily:'var(--mono)', letterSpacing:'-0.04em', lineHeight:1, color:stripeColor[cls] }}>{s.pct}%</div>
                  <div style={{ fontSize:9, fontFamily:'var(--mono)', color:'var(--text-3)', textTransform:'uppercase' }}>attended</div>
                </div>
              </div>
              <div style={{ paddingLeft:10 }}>
                <BarFill pct={s.pct} cls={cls} />
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  <span className="pill present">✓ {s.present}</span>
                  <span className="pill absent">✕ {absent}</span>
                  <span className="pill">{s.total} total</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button className="btn-refresh" onClick={refresh}>
        <span className={loading ? 'spin' : ''}>↻</span>
        <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
      </button>
      {fetchedAt && <div className="last-updated">Updated {new Date(fetchedAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</div>}
    </div>
  )
}
