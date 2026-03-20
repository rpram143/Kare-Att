export const SIS_BASE = 'https://sis.kalasalingam.ac.in'
export const LOGIN_PATH = '/login'
export const ATTEND_API = '/attendance-details'
export const MARKS_API = '/mark-details'
export const GRADE_PAGE = '/grade'
export const REG_PAGE = '/semester/registration'
export const SEATING_PAGE = '/seating'
export const MIN_ATT = 75
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const getBase = () => {
  // If no proxy is set, default to localhost:8010 to avoid direct CORS issues with the SIS server
  const p = localStorage.getItem('sis_proxy') || 'http://localhost:8010'
  return p.replace(/\/$/, '')
}

export const saveJar = (resp) => {
  const jar = resp.headers.get('X-Cookie-Jar');
  if (jar) localStorage.setItem('sis_jar', jar);
}

export const fmt12 = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export const gradeColor = (g) => {
  if (!g) return 'var(--text-2)'
  const s = g.trim().toUpperCase()
  if (s === 'O') return 'var(--green)'
  if (s === 'A+' || s === 'A') return 'var(--accent2)'
  if (s === 'B+' || s === 'B') return 'var(--cyan)'
  if (s === 'C' || s === 'D') return 'var(--amber)'
  if (s === 'F' || s === 'U') return 'var(--red)'
  return 'var(--text-2)'
}

export const attClass = (pct) => pct >= 85 ? 'good' : pct >= MIN_ATT ? 'warn' : 'bad'
