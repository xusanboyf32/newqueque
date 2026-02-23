import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import DrawerMenu from './DrawerMenu'

const PATIENT_NAV = [
  { path: '/dashboard/patient', icon: '⌂',  label: 'Asosiy' },
  { path: '/appointments',      icon: '📅', label: 'Navbat' },
  { path: '/ai',                icon: '✨',  label: 'AI' },
  { path: '/profile',           icon: '◻',  label: 'Profil' },
  { path: '/daftar',            icon: '📋', label: 'Daftar' },


]

const DOCTOR_NAV = [
  { path: '/dashboard/doctor', icon: '⌂',  label: 'Asosiy' },
  { path: '/appointments',     icon: '📅', label: 'Navbat' },
  { path: '/ai',               icon: '✨',  label: 'AI' },
  { path: '/profile',          icon: '◻',  label: 'Profil' },
]

export default function MobileLayout({ children }) {
  const { user }  = useAuth()
  const { theme, toggle, isDark } = useTheme()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const items = user?.role === 'ADMIN' ? DOCTOR_NAV : PATIENT_NAV

  return (
    <>
      <style>{`
        .mobile-root {
          display: flex; flex-direction: column;
          min-height: 100vh; background: var(--bg);
          font-family: 'DM Sans', sans-serif;
        }

        .mobile-topbar {
          position: fixed; top: 0; left: 0; right: 0;
          height: 56px; z-index: 50;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center;
          padding: 0 14px; gap: 8px;
          backdrop-filter: blur(16px);
        }

        .topbar-menu-btn {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--hover); border: none; cursor: pointer;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 5px;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .topbar-menu-btn:hover { background: var(--border); }
        .menu-bar {
          width: 17px; height: 2px;
          background: var(--text-secondary); border-radius: 2px;
          transition: all 0.28s cubic-bezier(0.4,0,0.2,1);
        }
        .topbar-menu-btn.active .menu-bar:nth-child(1) { transform: rotate(45deg) translate(5px,5px); }
        .topbar-menu-btn.active .menu-bar:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .topbar-menu-btn.active .menu-bar:nth-child(3) { transform: rotate(-45deg) translate(5px,-5px); }

        .topbar-brand {
          flex: 1; text-align: center;
          font-family: 'Syne', sans-serif;
          font-size: 17px; font-weight: 700;
          background: linear-gradient(90deg, #00c8aa, #5282ff);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        /* ── Sun/Moon toggle button ── */
        .topbar-theme-btn {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--hover); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
          transition: background 0.2s, transform 0.3s;
          position: relative; overflow: hidden;
        }
        .topbar-theme-btn:hover { background: var(--border); }
        .topbar-theme-btn:active { transform: scale(0.9); }

        .theme-icon {
          position: absolute;
          transition: opacity 0.3s, transform 0.4s cubic-bezier(0.4,0,0.2,1);
          line-height: 1;
        }
        .theme-icon.sun  { opacity: ${isDark ? 0 : 1}; transform: ${isDark ? 'rotate(-90deg) scale(0)' : 'rotate(0) scale(1)'}; }
        .theme-icon.moon { opacity: ${isDark ? 1 : 0}; transform: ${isDark ? 'rotate(0) scale(1)' : 'rotate(90deg) scale(0)'}; }

        .mobile-content {
          flex: 1;
          padding-top: 56px;
          padding-bottom: 76px;
          overflow-y: auto;
        }

        .mobile-nav {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
          background: var(--surface);
          border-top: 1px solid var(--border);
          display: flex;
          padding: 6px 0 max(8px, env(safe-area-inset-bottom));
          backdrop-filter: blur(16px);
        }
        .nav-item {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; gap: 3px;
          padding: 5px 0; cursor: pointer;
          border: none; background: none;
          color: var(--text-muted);
          transition: color 0.2s;
          position: relative;
        }
        .nav-item.active { color: var(--accent); }
        .nav-dot {
          position: absolute; top: -1px; left: 50%;
          transform: translateX(-50%);
          width: 20px; height: 3px; border-radius: 0 0 3px 3px;
          background: var(--accent);
          opacity: 0; transition: opacity 0.2s;
        }
        .nav-item.active .nav-dot { opacity: 1; }
        .nav-icon { font-size: 22px; line-height: 1; }
        .nav-label { font-size: 10px; font-weight: 500; letter-spacing: 0.2px; }
      `}</style>

      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="mobile-root">
        {/* Top bar */}
        <div className="mobile-topbar">
          <button
            className={`topbar-menu-btn${drawerOpen ? ' active' : ''}`}
            onClick={() => setDrawerOpen(v => !v)}
          >
            <div className="menu-bar" />
            <div className="menu-bar" />
            <div className="menu-bar" />
          </button>

          <span className="topbar-brand">NewQueue</span>

          {/* 🌙☀️ Toggle */}
          <button className="topbar-theme-btn" onClick={toggle} title={isDark ? 'Kun rejimi' : 'Tun rejimi'}>
            <span className="theme-icon sun">☀️</span>
            <span className="theme-icon moon">🌙</span>
          </button>
        </div>

        <div className="mobile-content">{children}</div>

        {/* Bottom nav */}
        <nav className="mobile-nav">
          {items.map(item => {
            const active = location.pathname === item.path
            return (
              <button
                key={item.path}
                className={`nav-item${active ? ' active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <div className="nav-dot" />
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </>
  )
}