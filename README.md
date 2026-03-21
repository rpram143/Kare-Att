<div align="center">

<!-- Main Banner -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f172a,50:1e3a5f,100:3b82f6&height=200&section=header&text=KARE-ATT&fontSize=72&fontColor=ffffff&fontAlignY=38&desc=Student%20Academic%20Companion%20for%20KARE%20SIS&descAlignY=58&descSize=18&descColor=94a3b8&animation=fadeIn" width="100%"/>

<!-- Badges -->
<p>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white&labelColor=0f172a"/>
  <img src="https://img.shields.io/badge/Capacitor-6-119EFF?style=for-the-badge&logo=capacitor&logoColor=white&labelColor=0f172a"/>
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white&labelColor=0f172a"/>
  <img src="https://img.shields.io/badge/Express-5-00D9FF?style=for-the-badge&logo=express&logoColor=white&labelColor=0f172a"/>
  <img src="https://img.shields.io/badge/Android-APK-3DDC84?style=for-the-badge&logo=android&logoColor=white&labelColor=0f172a"/>
  <img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white&labelColor=0f172a"/>
</p>

<p>
  <img src="https://img.shields.io/badge/University-KARE-FF6B6B?style=flat-square&labelColor=0f172a"/>
  <img src="https://img.shields.io/badge/Version-1.0.0-22c55e?style=flat-square&labelColor=0f172a"/>
  <img src="https://img.shields.io/badge/License-MIT-f59e0b?style=flat-square&labelColor=0f172a"/>
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20Web-8b5cf6?style=flat-square&labelColor=0f172a"/>
</p>

> **Track your attendance, marks, CGPA, and timetable — all from KARE SIS, without logging in every time.**

</div>

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🔐 **Smart Login** | XSRF-aware two-step auth with session cookie jar management |
| 📊 **Attendance Tracker** | Live subject-wise attendance with bunk margin calculator |
| 📝 **Marks Viewer** | Real-time marks pulled from KARE SIS |
| 🎓 **CGPA Calculator** | Semester-wise CGPA breakdown with grade colors |
| 🗓️ **Timetable** | Day-wise schedule viewer with period timings |
| 🔄 **Offline Cache** | Last-fetched data persists via localStorage — works without network |
| 📱 **Android APK** | Native Android app via Capacitor — real device feel |
| 🌐 **PWA Support** | Install as a web app on any browser |
| 🔀 **Proxy Server** | Local Express proxy to bypass CORS issues on web |
| 🎨 **Glassmorphism UI** | Dark-themed UI with animated orbs, glass cards, and smooth transitions |

---

## 🖥️ App Structure

```
kare-att/
├── src/
│   ├── App.jsx              # Root app, tab navigation, session state
│   ├── LoginScreen.jsx      # Auth screen (XSRF + session cookie login)
│   ├── AttendanceTab.jsx    # Attendance data + bunk margin calculator
│   ├── MarksTab.jsx         # Subject-wise marks viewer
│   ├── CgpaTab.jsx          # CGPA tracker
│   ├── TimetableTab.jsx     # Timetable display
│   ├── SplashScreen.jsx     # Animated boot splash
│   ├── Logo.jsx             # App logo component
│   ├── api.js               # API constants, cookie helpers, grade colors
│   └── index.css            # Global glass-themed styles
├── proxy.cjs                # Express CORS proxy for web builds
├── capacitor.config.json    # Android app config
├── vite.config.js           # Vite build config
└── package.json
```

---

## 🔐 Login Flow

```
User enters Reg No + Password
        │
        ▼
  GET /login  ──────────────────────────────────────►  SIS Server
  (fetch XSRF token + session cookie)                   │
        │◄─────────────────────────────────────────────┘
        │  Set-Cookie: XSRF-TOKEN, laravel_session
        │
        ▼
  POST /login  ─────────────────────────────────────►  SIS Server
  (credentials + X-XSRF-TOKEN header)                   │
        │◄─────────────────────────────────────────────┘
        │  302 Redirect → /home
        │
        ▼
  Follow redirect, parse student name from navbar
        │
        ▼
  Save session jar to localStorage
  Render dashboard
```

> The cookie jar is stored client-side and passed via `X-Cookie-Jar` header through the proxy on every subsequent request — mimicking a real browser session.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Android Studio (for APK builds)
- Java JDK 17+

### 1. Clone the Repo

```bash
git clone https://github.com/yourusername/kare-att.git
cd kare-att
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Web App (Dev Mode)

```bash
# Start the local CORS proxy (required for web login)
npm start          # runs proxy.cjs on port 8010

# In a separate terminal:
npm run dev        # starts Vite dev server
```

Open `http://localhost:5173` in your browser. Set the proxy URL to `http://localhost:8010` in the app settings if needed.

### 4. Build & Deploy as Android APK

```bash
npm run build          # Build the web app
npm run android        # Sync to Capacitor + open in Android Studio
```

Then in Android Studio → Build → Generate Signed APK / Build APK.

---

## 🛡️ How the Proxy Works

The `proxy.cjs` is a local Express server that acts as a CORS bypass for web builds:

```
Browser → proxy (localhost:8010) → sis.kalasalingam.ac.in
```

It handles the **Login Dance** automatically:
1. **GET /login** → fetches fresh XSRF token from SIS
2. **POST /login** → submits credentials with the token
3. **Follows 302 redirect** → returns the home page HTML with student name

Cookie state is maintained via a client-side `X-Cookie-Jar` header, which the proxy parses and updates on every request — no server-side sessions needed.

> For Android (native), CORS is not an issue — Capacitor makes direct HTTPS requests to SIS.

---

## 📊 Attendance Logic

Each subject card shows:

- ✅ **Present / Absent / Total** class counts
- 📈 **Percentage** with an animated progress bar
- 🧮 **Bunk Margin**: _"You can bunk X more classes"_ or _"Attend Y more to reach 75%"_

```js
// Bunk margin formula
const maxBunk = Math.floor(present / 0.75 - total);

// Classes needed to reach 75%
const needed = 3 * total - 4 * present;
```

Color coding:
| Range | Status | Color |
|-------|--------|-------|
| ≥ 85% | Safe | 🟢 Green |
| 75–84% | Warning | 🟡 Amber |
| < 75% | Danger | 🔴 Red |

---

## 🔧 Configuration

### Proxy URL

The app defaults to the live SIS server directly on Android. On web, you need to run the proxy:

```bash
npm start  # proxy on port 8010
```

In the app, tap **"Connection issues? Configure Proxy"** and set:
```
http://localhost:8010
```

### App ID (Capacitor)

```json
{
  "appId": "com.kare.attendance",
  "appName": "KARE SIS"
}
```

---

## 🧰 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Animations | Framer Motion |
| Native App | Capacitor 6 (Android) |
| Proxy Server | Express 5 + Axios |
| Styling | Pure CSS (Glassmorphism) |
| Storage | localStorage (cookie jar + cache) |
| Auth | XSRF + Laravel session cookie |

---

## ⚠️ Disclaimer

This is an **unofficial, student-built** companion app for KARE University's SIS portal. It is **not affiliated with or endorsed by Kalasalingam Academy of Research and Education**. Use it responsibly and at your own risk.

- Credentials are **never stored** — only the session cookie jar is cached
- Passwords are cleared from state immediately after login
- No data is sent to any third-party server

---

## 🤝 Contributing

Pull requests are welcome! If you find a bug or want to add a feature:

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push and open a PR

---

## 📄 License

MIT License © 2025 — Built with ❤️ by KARE students, for KARE students.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:3b82f6,50:1e3a5f,100:0f172a&height=120&section=footer&text=Made%20for%20KARE%20Students&fontSize=20&fontColor=94a3b8&fontAlignY=65&animation=fadeIn" width="100%"/>

</div>
