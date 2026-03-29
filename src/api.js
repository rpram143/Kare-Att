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
  const p = localStorage.getItem('sis_proxy')
  if (p) return p.replace(/\/$/, '')
  return SIS_BASE
}

export const safeParse = (str, fallback = null) => {
  try { return JSON.parse(str) } catch { return fallback }
}

export const getXsrf = () => {
  try {
    const jar = JSON.parse(localStorage.getItem('sis_jar') || '{}')
    return jar['XSRF-TOKEN'] ? decodeURIComponent(jar['XSRF-TOKEN']) : ''
  } catch {
    return ''
  }
}

export const saveJar = (resp) => {
  const newJarStr = resp.headers.get('X-Cookie-Jar')
  if (!newJarStr) return

  try {
    const oldJar = JSON.parse(localStorage.getItem('sis_jar') || '{}')
    const newJar = JSON.parse(newJarStr)
    const merged = { ...oldJar, ...newJar }
    localStorage.setItem('sis_jar', JSON.stringify(merged))
  } catch (e) {
    localStorage.setItem('sis_jar', newJarStr)
  }
}

export const fmt12 = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export const gradeColor = (g) => {
  if (!g) return 'var(--text-muted)'
  const s = g.trim().toUpperCase()
  if (s === 'O') return 'var(--success)'
  if (s === 'A+' || s === 'A') return 'var(--primary)'
  if (s === 'B+' || s === 'B') return 'var(--secondary)'
  if (s === 'C' || s === 'D') return 'var(--warning)'
  if (s === 'F' || s === 'U') return 'var(--error)'
  return 'var(--text-main)'
}

export const attClass = (pct) => pct >= 85 ? 'good' : pct >= MIN_ATT ? 'warn' : 'bad'
