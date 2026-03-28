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
  <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
    <div className="loader" />
  </div>
)

export default function App() {
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)
  const [studentName, setStudentName] = useState('')
  const [attData, setAttData] = useState(null)
  const [activeTab, setActiveTab] = useState('att')

  const [refreshKey, setRefreshKey] = useState(0)

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

  // Auto-refresh timer every 30 minutes
  useEffect(() => {
    if (!loggedIn) return
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1)
    }, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loggedIn])

  const handleLogin = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const nameEl = doc.querySelector('.navbar-right li a, .user-panel .info p, nav .dropdown-toggle')
    const name = nameEl ? nameEl.textContent.trim().replace(/\s+/g, ' ') : 'Student'

    localStorage.setItem('sis_name', name)
    setStudentName(name)
    setLoggedIn(true)
  }

  // Called by any tab when proxy returns 401 SESSION_EXPIRED
  const handleSessionExpired = () => {
    ['sis_reg', 'sis_pass', 'sis_name', 'sis_att_cache', 'sis_marks_cache', 'sis_cgpa_cache', 'sis_jar'].forEach(k => localStorage.removeItem(k))
    setLoggedIn(false); setStudentName(''); setAttData(null); setActiveTab('att')
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
        <div className="app-shell">
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
            <>
              {/* Topbar */}
              <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                padding: 'calc(var(--safe-top) + 16px) 20px 16px',
                background: 'rgba(4, 19, 41, 0.7)',
                backdropFilter: 'blur(30px)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Logo size={32} />
                  <div>
                    <h1 style={{ fontSize: 16, color: 'var(--text-main)' }}>{studentName}</h1>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Academic Portal</div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  style={{
                    background: 'var(--surface-hi)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    color: 'var(--text-secondary)',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '6px 12px',
                    cursor: 'pointer'
                  }}
                >
                  EXIT
                </button>
              </header>

              {/* Main Feed */}
              <main className="scroll-container">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="tab-content"
                  >
                    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}><div className="loader" /></div>}>
                      {activeTab === 'att' && <AttendanceTab initData={attData} refreshKey={refreshKey} onSessionExpired={handleSessionExpired} />}
                      {activeTab === 'marks' && <MarksTab refreshKey={refreshKey} onSessionExpired={handleSessionExpired} />}
                      {activeTab === 'cgpa' && <CgpaTab refreshKey={refreshKey} onSessionExpired={handleSessionExpired} />}
                      {activeTab === 'tt' && <TimetableTab refreshKey={refreshKey} onSessionExpired={handleSessionExpired} />}
                    </Suspense>
                  </motion.div>
                </AnimatePresence>
              </main>

              {/* Navigation */}
              <nav className="bottom-nav">
                <div className="nav-bar">
                  {TABS.map(({ id, label, Icon }) => {
                    const isActive = activeTab === id
                    return (
                      <motion.div
                        key={id}
                        onClick={() => setActiveTab(id)}
                        whileTap={{ scale: 0.95 }}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                      >
                        <Icon />
                        <span style={{ fontSize: 10, fontWeight: isActive ? 800 : 500 }}>{label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeTabGlow"
                            style={{
                              position: 'absolute',
                              bottom: 4,
                              width: 12,
                              height: 2,
                              background: 'var(--primary)',
                              borderRadius: 4,
                              boxShadow: '0 2px 8px var(--primary-glow)'
                            }}
                          />
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </nav>
            </>
          )}
        </div>
      )}
    </>
  )
}
