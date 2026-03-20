import { useState } from 'react'
import { DAYS, fmt12 } from './api'

export default function TimetableTab() {
  const [ttData,    setTtData]    = useState(() => JSON.parse(localStorage.getItem('sis_tt') || '{}'))
  const [ttDay,     setTtDay]     = useState(DAYS[new Date().getDay() - 1] || 'Monday')
  const [showModal, setShowModal] = useState(false)
  const [form,      setForm]      = useState({ subject:'', day:'Monday', start:'09:00', end:'10:00', room:'', color:'#6366f1' })

  const save = (updated) => { setTtData(updated); localStorage.setItem('sis_tt', JSON.stringify(updated)) }

  const addSlot = () => {
    if (!form.subject || !form.start || !form.end) return
    const updated = { ...ttData }
    if (!updated[form.day]) updated[form.day] = []
    updated[form.day] = [...updated[form.day], { subject:form.subject, start:form.start, end:form.end, room:form.room, color:form.color }]
    save(updated)
    setTtDay(form.day)
    setForm(f => ({ ...f, subject:'', room:'' }))
    setShowModal(false)
  }

  const delSlot = (day, idx) => save({ ...ttData, [day]: ttData[day].filter((_,i) => i !== idx) })

  const slots = (ttData[ttDay] || []).slice().sort((a,b) => a.start.localeCompare(b.start))

  return (
    <div style={{ padding:16, paddingBottom:'calc(16px + var(--safe-bottom))' }}>
      <div className="section-hd" style={{ marginBottom:8 }}>
        <span className="section-title">Weekly Schedule</span>
        <span className="section-badge" style={{ cursor:'pointer', color:'var(--accent2)' }} onClick={() => setShowModal(true)}>+ Add</span>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:16, overflowX:'auto', scrollbarWidth:'none', paddingBottom:4 }}>
        {DAYS.map(d => (
          <button key={d} className={`day-pill${d === ttDay ? ' active' : ''}`} onClick={() => setTtDay(d)}>{d.slice(0,3)}</button>
        ))}
      </div>

      {slots.length === 0 ? (
        <div style={{ textAlign:'center', padding:32, fontFamily:'var(--mono)', fontSize:12, color:'var(--text-3)', lineHeight:1.8 }}>
          No classes on {ttDay}.<br/>Tap + Add to add one.
        </div>
      ) : slots.map((s, i) => (
        <div key={i} className={`slide-up d${Math.min(i+1,8)}`} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'14px 16px', display:'flex', gap:12, alignItems:'center', marginBottom:8 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, background:s.color }} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.subject}</div>
            {s.room && <div style={{ fontSize:11, color:'var(--text-2)', fontFamily:'var(--mono)', marginTop:2 }}>📍 {s.room}</div>}
          </div>
          <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text-2)', flexShrink:0, textAlign:'right' }}>
            {fmt12(s.start)}<br/><span style={{ color:'var(--text-3)' }}>{fmt12(s.end)}</span>
          </div>
          <button onClick={() => delSlot(ttDay, i)} style={{ background:'none', border:'none', color:'var(--text-3)', cursor:'pointer', fontSize:18, padding:4, flexShrink:0 }}>×</button>
        </div>
      ))}

      <button style={{ width:'100%', background:'var(--bg-card)', border:'1px dashed var(--border-hi)', borderRadius:14, padding:14, color:'var(--text-2)', fontFamily:'var(--mono)', fontSize:12, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.1em', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
        onClick={() => setShowModal(true)}>＋ Add Class</button>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-handle" />
            <h3>Add Class</h3>
            <div className="field">
              <label className="field-label">Subject Name</label>
              <input className="field-input" placeholder="e.g. Machine Learning" value={form.subject} onChange={e => setForm(f => ({...f, subject:e.target.value}))} />
            </div>
            <div className="modal-row">
              <div className="field" style={{ marginBottom:0 }}>
                <label className="field-label">Day</label>
                <select className="field-input" value={form.day} onChange={e => setForm(f => ({...f, day:e.target.value}))}>
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="field" style={{ marginBottom:0 }}>
                <label className="field-label">Color</label>
                <select className="field-input" value={form.color} onChange={e => setForm(f => ({...f, color:e.target.value}))}>
                  <option value="#6366f1">Indigo</option>
                  <option value="#34d399">Green</option>
                  <option value="#f87171">Red</option>
                  <option value="#fbbf24">Amber</option>
                  <option value="#22d3ee">Cyan</option>
                  <option value="#a78bfa">Violet</option>
                </select>
              </div>
            </div>
            <div className="modal-row" style={{ marginTop:10 }}>
              <div className="field" style={{ marginBottom:0 }}>
                <label className="field-label">Start</label>
                <input className="field-input" type="time" value={form.start} onChange={e => setForm(f => ({...f, start:e.target.value}))} />
              </div>
              <div className="field" style={{ marginBottom:0 }}>
                <label className="field-label">End</label>
                <input className="field-input" type="time" value={form.end} onChange={e => setForm(f => ({...f, end:e.target.value}))} />
              </div>
            </div>
            <div className="field" style={{ marginTop:10 }}>
              <label className="field-label">Room (optional)</label>
              <input className="field-input" placeholder="e.g. AB2-301" value={form.room} onChange={e => setForm(f => ({...f, room:e.target.value}))} />
            </div>
            <div className="modal-btns">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-solid" onClick={addSlot}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
