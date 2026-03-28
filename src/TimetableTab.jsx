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

export default function TimetableTab({ onSessionExpired }) {
  const [ttData, setTtData] = useState(() => JSON.parse(localStorage.getItem('sis_tt') || '{}'))
  const [ttDay, setTtDay] = useState(DAYS[new Date().getDay() - 1] || 'Monday')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [form, setForm] = useState({ subject: '', day: 'Monday', start: '09:00', end: '10:00', room: '', color: 'var(--primary)' })

  const save = (updated) => { setTtData(updated); localStorage.setItem('sis_tt', JSON.stringify(updated)) }

  const syncFromSIS = async () => {
    setLoading(true)
    setStatus({ type: '', message: '' })
    try {
      const jarStr = localStorage.getItem('sis_jar') || '{}';

      const resp = await fetch(`${getBase()}${REG_PAGE}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'text/html,*/*',
          'X-Cookie-Jar': jarStr,
        }
      })
      saveJar(resp)

      if (resp.status === 401) {
        const body = await resp.json().catch(() => ({}))
        if (body.error === 'SESSION_EXPIRED') { onSessionExpired?.(); return; }
      }
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
    <div style={{ padding: '0 0 24px' }}>
      <div className="section-hd" style={{ marginBottom: 24, padding: '0 4px' }}>
        <h2 className="display-txt" style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Operational Schedule</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={syncFromSIS}
            disabled={loading}
            style={{
              background: 'var(--surface-hi)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-secondary)',
              fontSize: 10,
              fontWeight: 800,
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span className={loading ? 'loader' : ''} style={loading ? { width: 10, height: 10, borderWidth: 2 } : {}}>
              {!loading && '↻'}
            </span>
            SYNC SIS
          </button>
        </div>
      </div>

      {/* Day Selector */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 32,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        padding: '0 4px 12px',
        maskImage: 'linear-gradient(to right, black 80%, transparent)'
      }}>
        {DAYS.map(d => {
          const isActive = d === ttDay
          return (
            <motion.button
              key={d}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTtDay(d)}
              style={{
                background: isActive ? 'var(--primary)' : 'var(--surface-hi)',
                color: isActive ? 'var(--bg-dark)' : 'var(--text-secondary)',
                border: isActive ? 'none' : '1px solid var(--border)',
                borderRadius: 16,
                padding: '12px 24px',
                fontSize: 13,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                flexShrink: 0,
                boxShadow: isActive ? '0 8px 20px var(--primary-glow)' : 'none'
              }}
            >
              {d.charAt(0) + d.slice(1, 3).toLowerCase()}
            </motion.button>
          )
        })}
      </div>

      {status.message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={status.type === 'error' ? 'pill-error' : 'pill-success'}
          style={{ padding: 16, borderRadius: 16, marginBottom: 24, textAlign: 'center', fontSize: 12, fontWeight: 700 }}
        >
          {status.message.toUpperCase()}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={ttDay}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {slots.length === 0 ? (
            <div className="glass-card text-center" style={{ padding: '80px 24px', opacity: 0.6, borderStyle: 'dashed' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>☕️</div>
              <p className="display-txt" style={{ fontSize: 16, color: 'var(--text-main)', marginBottom: 4 }}>NO SESSIONS SCHEDULED</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Enjoy your administrative recess for {ttDay}.</p>
            </div>
          ) : (
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {slots.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card"
                  style={{
                    padding: '20px 24px',
                    display: 'flex',
                    gap: 20,
                    alignItems: 'center',
                    borderLeft: `3px solid ${s.color || 'var(--primary)'}`
                  }}
                >
                  <div style={{ textAlign: 'center', minWidth: 64 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>{fmt12(s.start)}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginTop: 2 }}>{fmt12(s.end)}</div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>{s.subject}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {s.room && (
                        <div className="pill" style={{ background: 'var(--surface-highest)', color: 'var(--primary)', padding: '4px 8px', fontSize: 9 }}>
                          LOCATION: {s.room}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>VERIFIED</div>
                    </div>
                  </div>

                  <button
                    onClick={() => delSlot(ttDay, i)}
                    style={{
                      background: 'var(--surface-highest)',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      width: 32, height: 32,
                      borderRadius: 12,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 16
                    }}
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div style={{ marginTop: 40, padding: '0 4px' }}>
        <button
          className="btn-primary"
          onClick={() => setShowModal(true)}
          style={{ height: 64, borderRadius: 20 }}
        >
          APPEND NEW SESSION
        </button>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              background: 'rgba(1, 14, 36, 0.8)',
              backdropFilter: 'blur(20px)'
            }}
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: 500,
                borderRadius: '32px 32px 0 0',
                padding: '32px 24px calc(32px + var(--safe-bottom))',
                borderBottom: 'none'
              }}
            >
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 24px' }} />
              <h3 className="display-txt" style={{ fontSize: 24, color: 'var(--text-main)', marginBottom: 32 }}>Manual Override</h3>

              <div className="field-group">
                <label className="field-label">Course Nomenclature</label>
                <input className="field-input" placeholder="Enter subject name" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>

              <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="field-group">
                  <label className="field-label">Scheduled Day</label>
                  <select className="field-input" style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }} value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))}>
                    {DAYS.map(d => <option key={d} style={{ background: 'var(--bg)' }}>{d}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">System Tint</label>
                  <select className="field-input" style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }} value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}>
                    <option value="var(--primary)" style={{ background: 'var(--bg)' }}>Cyan</option>
                    <option value="var(--secondary)" style={{ background: 'var(--bg)' }}>Emerald</option>
                    <option value="var(--tertiary)" style={{ background: 'var(--bg)' }}>Amber</option>
                    <option value="#6366f1" style={{ background: 'var(--bg)' }}>Indigo</option>
                    <option value="var(--error)" style={{ background: 'var(--bg)' }}>Coral</option>
                  </select>
                </div>
              </div>

              <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="field-group">
                  <label className="field-label">Commencement</label>
                  <input className="field-input" type="time" value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} />
                </div>
                <div className="field-group">
                  <label className="field-label">Conclusion</label>
                  <input className="field-input" type="time" value={form.end} onChange={e => setForm(f => ({ ...f, end: e.target.value }))} />
                </div>
              </div>

              <div className="field-group" style={{ marginBottom: 40 }}>
                <label className="field-label">Location / Hub</label>
                <input className="field-input" placeholder="e.g. AB1-102" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <button className="btn-secondary" onClick={() => setShowModal(false)}>ABORT</button>
                <button className="btn-primary" style={{ padding: 16 }} onClick={addSlot}>EXECUTE</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
