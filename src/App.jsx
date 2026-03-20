import { useState, useEffect, Suspense, lazy } from 'react'
import LoginScreen from './LoginScreen'
import AttendanceTab from './AttendanceTab'
import Logo from './Logo'
import SplashScreen from './SplashScreen'
import { motion, AnimatePresence } from 'framer-motion'

const MarksTab = lazy(() => import('./MarksTab'))
const CgpaTab = lazy(() => import('./CgpaTab'))
const TimetableTab = lazy(() => import('./TimetableTab'))

const BarChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="12" width="4" height="9" rx="1" /><rect x="10" y="7" width="4" height="14" rx="1" /><rect x="17" y="3" width="4" height="18" rx="1" />
  </svg>
)
const ClipboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
  </svg>
)
const GradCapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
)
const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <circle cx="8" cy="14" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="14" r="1" fill="currentColor" stroke="none" />
    <circle cx="8" cy="18" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
  </svg>
)

const TABS = [
  { id: 'att', label: 'Attendance', Icon: BarChartIcon },
  { id: 'marks', label: 'Marks', Icon: ClipboardIcon },
  { id: 'cgpa', label: 'CGPA', Icon: GradCapIcon },
  { id: 'tt', label: 'Timetable', Icon: CalendarIcon },
]

const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
    <div style={{ width: 36, height: 36, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
  </div>
)

export default function App() {
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)
  const [studentName, setStudentName] = useState('')
  const [attData, setAttData] = useState(null)
  const [activeTab, setActiveTab] = useState('att')

  // Load from cache on start
  useEffect(() => {
    const splashTimer = setTimeout(() => setLoading(false), 3000)

    const n = localStorage.getItem('sis_name')
    const c = localStorage.getItem('sis_att_cache')
    if (n && c) {
      setStudentName(n)
      setAttData(JSON.parse(c))
      setLoggedIn(true)
    }

    return () => clearTimeout(splashTimer)
  }, [])

  const handleLogin = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const nameEl = doc.querySelector('.navbar-right li a, .user-panel .info p, nav .dropdown-toggle')
    const name = nameEl ? nameEl.textContent.trim().replace(/\s+/g, ' ') : 'Student'

    localStorage.setItem('sis_name', name)
    setStudentName(name)
    setLoggedIn(true)
  }

  const logout = () => {
    ['sis_reg', 'sis_pass', 'sis_name', 'sis_att_cache', 'sis_marks_cache', 'sis_cgpa_cache', 'sis_jar'].forEach(k => localStorage.removeItem(k))
    setLoggedIn(false); setStudentName(''); setAttData(null); setActiveTab('att')
  }

  const activeIndex = TABS.findIndex(t => t.id === activeTab)

  return (
    <>
      <SplashScreen show={loading} />

      {!loading && (
        <div style={{ minHeight: '100svh', background: 'var(--bg)', color: 'white', position: 'relative', overflow: 'hidden' }}>

          {/* Background Decor */}
          <div className="bg-orbs">
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />
            <div className="bg-grid" />
          </div>

          {!loggedIn ? (
            <LoginScreen onLogin={handleLogin} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100svh', position: 'relative', zIndex: 1 }}>

              {/* Topbar */}
              <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                padding: 'calc(var(--safe-top) + 16px) 20px 16px',
                background: 'rgba(6, 14, 32, 0.7)',
                backdropFilter: 'blur(30px)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Logo size={36} />
                  <div>
                    <h1 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: 'white' }}>{studentName}</h1>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Academic Profile</div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    color: 'var(--text-secondary)',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '8px 12px',
                    cursor: 'pointer'
                  }}
                >
                  LOGOUT
                </button>
              </div>

              {/* Swipeable Tabs Container */}
              <div style={{ flex: 1, position: 'relative', overflowX: 'hidden' }}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.4}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipe = offset.x;
                      const vel = velocity.x;
                      if (swipe < -100 || vel < -500) {
                        if (activeIndex < TABS.length - 1) setActiveTab(TABS[activeIndex + 1].id)
                      } else if (swipe > 100 || vel > 500) {
                        if (activeIndex > 0) setActiveTab(TABS[activeIndex - 1].id)
                      }
                    }}
                    style={{
                      height: '100%',
                      overflowY: 'auto',
                      paddingBottom: 'calc(var(--safe-bottom) + 100px)',
                      touchAction: 'pan-y'
                    }}
                  >
                    <Suspense fallback={<Loader />}>
                      {activeTab === 'att' && <AttendanceTab initData={attData} />}
                      {activeTab === 'marks' && <MarksTab />}
                      {activeTab === 'cgpa' && <CgpaTab />}
                      {activeTab === 'tt' && <TimetableTab />}
                    </Suspense>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom Nav Bar */}
              <div style={{
                position: 'fixed',
                bottom: 'calc(var(--safe-bottom) + 20px)',
                left: 20,
                right: 20,
                zIndex: 100
              }}>
                <div className="glass-card" style={{
                  padding: '8px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderRadius: 24,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  {TABS.map(({ id, label, Icon }) => {
                    const isActive = activeTab === id
                    return (
                      <motion.div
                        key={id}
                        onClick={() => setActiveTab(id)}
                        whileTap={{ scale: 0.9 }}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          padding: '8px 4px',
                          cursor: 'pointer',
                          color: isActive ? 'var(--accent-light)' : 'var(--text-muted)',
                          position: 'relative'
                        }}
                      >
                        <Icon />
                        <span style={{ fontSize: 10, fontWeight: isActive ? 800 : 500, letterSpacing: '-0.01em' }}>{label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            style={{
                              position: 'absolute',
                              top: -8,
                              width: 24,
                              height: 3,
                              background: 'var(--accent-light)',
                              borderRadius: '0 0 10px 10px',
                              boxShadow: '0 4px 10px var(--accent-glow)'
                            }}
                          />
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </>
  )
}
