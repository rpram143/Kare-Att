import { useState, useEffect, Suspense, lazy } from 'react'
import LoginScreen  from './LoginScreen'
import AttendanceTab from './AttendanceTab'

const MarksTab     = lazy(() => import('./MarksTab'))
const CgpaTab      = lazy(() => import('./CgpaTab'))
const TimetableTab = lazy(() => import('./TimetableTab'))

const BarChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/>
  </svg>
)
const ClipboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
    <rect x="9" y="3" width="6" height="4" rx="1"/>
    <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
  </svg>
)
const GradCapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
)
const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <circle cx="8"  cy="14" r="1" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none"/>
    <circle cx="16" cy="14" r="1" fill="currentColor" stroke="none"/>
    <circle cx="8"  cy="18" r="1" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/>
  </svg>
)

const TABS = [
  { id:'att',   label:'Attendance', Icon:BarChartIcon },
  { id:'marks', label:'Marks',      Icon:ClipboardIcon },
  { id:'cgpa',  label:'CGPA',       Icon:GradCapIcon },
  { id:'tt',    label:'Timetable',  Icon:CalendarIcon },
]

const Loader = () => (
  <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
    <div style={{ width:36, height:36, border:'2px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.75s linear infinite' }} />
  </div>
)

export default function App() {
  const [loggedIn,     setLoggedIn]     = useState(false)
  const [studentName,  setStudentName]  = useState('')
  const [attData,      setAttData]      = useState(null)
  const [activeTab,    setActiveTab]    = useState('att')

  // Load from cache on start if offline or already logged in
  useEffect(() => {
    const n = localStorage.getItem('sis_name')
    const c = localStorage.getItem('sis_att_cache')
    if (n && c) {
      setStudentName(n)
      setAttData(JSON.parse(c))
      setLoggedIn(true)
    }
  }, [])

  const handleLogin = (name, att) => {
    setStudentName(name)
    setAttData(att)
    setLoggedIn(true)
  }

  const logout = () => {
    ['sis_reg','sis_pass','sis_name','sis_att_cache','sis_marks_cache','sis_cgpa_cache','sis_jar'].forEach(k => localStorage.removeItem(k))
    setLoggedIn(false); setStudentName(''); setAttData(null); setActiveTab('att')
  }

  return (
    <>
      <div className="bg-orbs">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      </div>
      <div className="bg-grid" />

      {!loggedIn ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', minHeight:'100svh', position:'relative', zIndex:1 }}>

          {/* Topbar */}
          <div style={{ position:'sticky', top:0, zIndex:20, padding:'calc(var(--safe-top) + 12px) 16px 12px', background:'rgba(8,12,24,0.85)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:10, fontFamily:'var(--mono)', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Signed in as</div>
              <div style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.02em', marginTop:1 }}>{studentName}</div>
            </div>
            <button onClick={logout} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text-2)', fontFamily:'var(--mono)', fontSize:11, padding:'8px 12px', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.06em' }}>
              Sign out
            </button>
          </div>

          {/* Tab bar */}
          <div style={{ display:'flex', background:'rgba(8,12,24,0.85)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderBottom:'1px solid var(--border)', padding:'0 8px', overflowX:'auto', scrollbarWidth:'none' }}>
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{ flex:1, minWidth:80, padding:'12px 8px 10px', background:'none', border:'none', color: activeTab===id ? 'var(--accent2)' : 'var(--text-3)', fontFamily:'var(--sans)', fontSize:11, fontWeight:500, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5, transition:'color 0.2s', position:'relative', whiteSpace:'nowrap' }}>
                <Icon />
                <span>{label}</span>
                {activeTab===id && (
                  <div style={{ position:'absolute', bottom:0, left:'20%', right:'20%', height:2, background:'linear-gradient(90deg,var(--accent),var(--accent2))', borderRadius:'2px 2px 0 0' }} />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex:1, overflowY:'auto' }}>
            <Suspense fallback={<Loader />}>
              {activeTab === 'att'   && <AttendanceTab initData={attData} />}
              {activeTab === 'marks' && <MarksTab />}
              {activeTab === 'cgpa'  && <CgpaTab />}
              {activeTab === 'tt'    && <TimetableTab />}
            </Suspense>
          </div>
        </div>
      )}
    </>
  )
}
