import { useState } from 'react'
import { DAYS, fmt12, getBase, REG_PAGE, saveJar } from './api'
import { motion, AnimatePresence } from 'framer-motion'

// Helper to map SIS slots (e.g., MON1, TUE2) to times
const SLOT_MAP = {
  '1': { start: '09:00', end: '09:50' },
  '2': { start: '09:50', end: '10:40' },
  '3': { start: '11:00', end: '11:50' },
  '4': { start: '11:50', end: '12:40' },
  '5': { start: '13:40', end: '14:30' },
  '6': { start: '14:30', end: '15:20' },
  '7': { start: '15:30', end: '16:20' },
  '8': { start: '16:20', end: '17:10' },
}

export default function TimetableTab() {
  const [ttData, setTtData] = useState(() => JSON.parse(localStorage.getItem('sis_tt') || '{}'))
  const [ttDay, setTtDay] = useState(DAYS[new Date().getDay() - 1] || 'Monday')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [form, setForm] = useState({ subject: '', day: 'Monday', start: '09:00', end: '10:00', room: '', color: '#6366f1' })

  const save = (updated) => { setTtData(updated); localStorage.setItem('sis_tt', JSON.stringify(updated)) }

  const syncFromSIS = async () => {
    setLoading(true)
    setStatus({ type: '', message: '' })
    try {
      const resp = await fetch(`${getBase()}${REG_PAGE}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'text/html,*/*',
          'X-Cookie-Jar': localStorage.getItem('sis_jar') || '{}'
        }
      })
      saveJar(resp)
      const html = await resp.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')

      const newTt = {}
      const rows = doc.querySelectorAll('table tbody tr')

      rows.forEach(row => {
        const cells = [...row.querySelectorAll('td')].map(c => c.textContent.trim())
        if (cells.length < 5) return

        const subject = cells[2]
        const slotRaw = cells[4] || ''
        const room = cells[5] || ''

        if (!subject || !slotRaw) return

        const slotParts = slotRaw.split(/[,/ ]+/).filter(Boolean)
        let lastDay = null;

        slotParts.forEach(p => {
          // Check for Day + Slot (e.g., MON1, MON1-2)
          const match = p.match(/^([A-Z]{3})(\d+)(?:-(\d+))?$/i);
          if (match) {
            const dayCode = match[1].toUpperCase();
            const dayName = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday' }[dayCode];
            if (dayName) {
              lastDay = dayName;
              const startSlot = parseInt(match[2]);
              const endSlot = match[3] ? parseInt(match[3]) : startSlot;
              for (let s = startSlot; s <= endSlot; s++) {
                addSlotToTt(newTt, dayName, String(s), subject, room);
              }
            }
          } else if (lastDay) {
            // Check for trailing slots (e.g., 2 in MON1,2)
            const numMatch = p.match(/^(\d+)(?:-(\d+))?$/);
            if (numMatch) {
              const startSlot = parseInt(numMatch[1]);
              const endSlot = numMatch[2] ? parseInt(numMatch[2]) : startSlot;
              for (let s = startSlot; s <= endSlot; s++) {
                addSlotToTt(newTt, lastDay, String(s), subject, room);
              }
            }
          }
        })
      })

      // Helper for adding slot to transient timetable object
      function addSlotToTt(tt, day, slotNum, subject, room) {
        const time = SLOT_MAP[slotNum];
        if (!time) return;
        if (!tt[day]) tt[day] = [];
        tt[day].push({
          subject,
          start: time.start,
          end: time.end,
          room,
          color: `hsl(${(tt[day].length) * 40 + 200}, 70%, 60%)`
        });
      }

      if (Object.keys(newTt).length > 0) {
        save(newTt)
        setStatus({ type: 'success', message: 'Timetable synced successfully.' })
      } else {
        throw new Error('No timetable data found on the registration page.')
      }
    } catch (err) {
      console.error(err)
      setStatus({ type: 'error', message: err.message || 'Sync failed. Ensure you are logged in.' })
    } finally {
      setLoading(false)
    }
  }

  const addSlot = () => {
    if (!form.subject || !form.start || !form.end) return
    const updated = { ...ttData }
    if (!updated[form.day]) updated[form.day] = []
    updated[form.day] = [...updated[form.day], { subject: form.subject, start: form.start, end: form.end, room: form.room, color: form.color }]
    save(updated)
    setTtDay(form.day)
    setForm(f => ({ ...f, subject: '', room: '' }))
    setShowModal(false)
  }

  const delSlot = (day, idx) => save({ ...ttData, [day]: ttData[day].filter((_, i) => i !== idx) })

  const slots = (ttData[ttDay] || []).slice().sort((a, b) => a.start.localeCompare(b.start))

  return (
    <div style={{ padding: 20 }}>
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-3" />
      </div>

      <div className="section-hd" style={{ marginBottom: 16 }}>
        <span className="section-title">Class Schedule</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <motion.span
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="section-badge"
            style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            onClick={syncFromSIS}
          >
            {loading ? '⏳ Syncing...' : '↻ Sync SIS'}
          </motion.span>
          <motion.span
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="section-badge"
            style={{ cursor: 'pointer', background: 'var(--accent)', color: 'white' }}
            onClick={() => setShowModal(true)}
          >
            + Add
          </motion.span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
        {DAYS.map(d => (
          <button
            key={d}
            className={`day-pill${d === ttDay ? ' active' : ''}`}
            onClick={() => setTtDay(d)}
          >
            {d.slice(0, 3)}
          </button>
        ))}
      </div>

      {status.message && (
        <div className={status.type === 'error' ? 'status-banner error' : 'status-banner success'}>
          {status.message}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={ttDay}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}
        >
          {slots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', borderRadius: 24, border: '1px dashed var(--border)' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>No classes scheduled for {ttDay}.<br />Enjoy your break! ☕️</p>
            </div>
          ) : slots.map((s, i) => (
            <motion.div
              key={i}
              className="glass-card"
              style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center', position: 'relative' }}
            >
              <div style={{ width: 4, height: 40, borderRadius: 4, flexShrink: 0, background: s.color }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.subject}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  {s.room && <span style={{ fontSize: 11, color: 'var(--accent-light)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>📍 {s.room}</span>}
                  {s.room && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>•</span>}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Scheduled class</span>
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'white', flexShrink: 0, textAlign: 'right', fontWeight: 600 }}>
                {fmt12(s.start)}<br />
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{fmt12(s.end)}</span>
              </div>
              <button
                onClick={() => delSlot(ttDay, i)}
                style={{ background: 'rgba(255,255,255,0.03)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, padding: '4px 8px', borderRadius: 8 }}
              >
                ×
              </button>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.98 }}
        style={{ width: '100%', background: 'var(--surface)', border: '1px dashed var(--border-hi)', borderRadius: 18, padding: '18px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        onClick={() => setShowModal(true)}
      >
        ＋ Add New Class Slot
      </motion.button>

      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="modal"
            >
              <div className="modal-handle" />
              <h3 style={{ color: 'white', marginBottom: 20 }}>Add New Class</h3>

              <div className="field">
                <label className="field-label">Subject Name</label>
                <input className="field-input" placeholder="e.g. Machine Learning" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>

              <div className="modal-row">
                <div className="field">
                  <label className="field-label">Day</label>
                  <select className="field-input" value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))}>
                    {DAYS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Theme Color</label>
                  <select className="field-input" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}>
                    <option value="#6366f1">Indigo</option>
                    <option value="#34d399">Green</option>
                    <option value="#f87171">Red</option>
                    <option value="#fbbf24">Amber</option>
                    <option value="#22d3ee">Cyan</option>
                    <option value="#a78bfa">Violet</option>
                  </select>
                </div>
              </div>

              <div className="modal-row">
                <div className="field">
                  <label className="field-label">Start Time</label>
                  <input className="field-input" type="time" value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="field-label">End Time</label>
                  <input className="field-input" type="time" value={form.end} onChange={e => setForm(f => ({ ...f, end: e.target.value }))} />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Room / Building</label>
                <input className="field-input" placeholder="e.g. AB2-301" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} />
              </div>

              <div className="modal-btns">
                <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-solid" onClick={addSlot}>Create Class</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
