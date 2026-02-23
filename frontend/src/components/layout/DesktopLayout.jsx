import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import DrawerMenu from './DrawerMenu'
import ThemeToggle from '../ui/ThemeToggle'

const PATIENT_ITEMS = [
  { path: '/dashboard/patient', icon: '⌂',  label: 'Asosiy' },
  { path: '/appointments',      icon: '📅', label: 'Qabulga yozilish' },
  { path: '/ai',                icon: '✨',  label: 'AI Yordamchi' },
  { path: '/daftar',            icon: '📋', label: 'Tibbiy Daftar' },
  { path: '/prescriptions', icon: '💊', label: 'Retseptlar' },
  { path: '/profile',           icon: '◻',  label: 'Profil' },
]

const DOCTOR_ITEMS = [
  { path: '/dashboard/doctor', icon: '⌂',  label: 'Asosiy' },
  { path: '/appointments',     icon: '📅', label: 'Qabulga yozilish' },
  { path: '/ai',               icon: '✨',  label: 'AI Yordamchi' },
  { path: '/profile',          icon: '◻',  label: 'Profil' },
]

export default function DesktopLayout({ children }) {
  const { user }  = useAuth()
  const { isDark, toggle } = useTheme()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [drawerOpen,  setDrawerOpen]  = useState(false)
  const [collapsed,   setCollapsed]   = useState(false)

  const items = user?.role === 'ADMIN' ? DOCTOR_ITEMS : PATIENT_ITEMS
  const W = collapsed ? 68 : 220

  return (
    <>
      <style>{`
        .desktop-root {
          display: flex; min-height: 100vh;
          background: var(--bg);
          font-family: 'DM Sans', sans-serif;
        }

        .sidebar {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: ${W}px; z-index: 40;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          transition: width 0.25s cubic-bezier(0.4,0,0.2,1);
          overflow: hidden;
        }

        .sidebar-header {
          height: 60px;
          display: flex; align-items: center;
          padding: 0 16px; gap: 10px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .sidebar-logo {
          width: 34px; height: 34px; flex-shrink: 0;
          background: linear-gradient(135deg, #00c8aa, #5282ff);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; cursor: pointer;
          transition: transform 0.2s;
        }
        .sidebar-logo:hover { transform: scale(1.05); }
        .sidebar-brand {
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 700;
          background: linear-gradient(90deg, var(--text-primary), var(--text-secondary));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          white-space: nowrap;
          opacity: ${collapsed ? 0 : 1};
          transition: opacity 0.15s;
        }

        .sidebar-nav {
          flex: 1; padding: 12px 8px;
          display: flex; flex-direction: column; gap: 2px;
          overflow-y: auto;
        }
        .s-item {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 12px; border-radius: 12px;
          cursor: pointer; border: none;
          background: none; width: 100%; text-align: left;
          color: var(--text-muted);
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap; overflow: hidden;
          position: relative;
        }
        .s-item:hover { background: var(--hover); color: var(--text-primary); }
        .s-item.active { background: var(--accent-dim); color: var(--accent); }
        .s-item.active::before {
          content: '';
          position: absolute; left: 0; top: 20%; bottom: 20%;
          width: 3px; border-radius: 0 3px 3px 0;
          background: var(--accent);
        }
        .s-icon { font-size: 20px; flex-shrink: 0; width: 24px; text-align: center; }
        .s-label {
          opacity: ${collapsed ? 0 : 1};
          transition: opacity 0.12s; font-weight: 500;
        }

        .sidebar-bottom {
          padding: 8px 8px 20px;
          border-top: 1px solid var(--border);
          display: flex; flex-direction: column; gap: 4px;
        }

        /* Theme toggle row in sidebar */
        .s-theme-wrap {
          padding: 4px 4px;
          opacity: ${collapsed ? 0 : 1};
          transition: opacity 0.15s;
          pointer-events: ${collapsed ? 'none' : 'all'};
        }

        /* Collapsed theme btn */
        .s-theme-icon-btn {
          display: ${collapsed ? 'flex' : 'none'};
          width: 100%;
          align-items: center; justify-content: center;
          padding: 10px 0; border: none; background: none;
          cursor: pointer; font-size: 20px;
          border-radius: 12px; transition: background 0.15s;
        }
        .s-theme-icon-btn:hover { background: var(--hover); }

        .s-user-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 12px;
          cursor: pointer; border: none; background: none;
          width: 100%; text-align: left; overflow: hidden;
          transition: background 0.15s;
        }
        .s-user-btn:hover { background: var(--hover); }
        .s-avatar {
          width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, #00c8aa, #5282ff);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #fff;
          font-family: 'Syne', sans-serif;
        }
        .s-user-info {
          overflow: hidden;
          opacity: ${collapsed ? 0 : 1}; transition: opacity 0.12s;
        }
        .s-user-name {
          font-size: 13px; color: var(--text-primary);
          font-weight: 500; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .s-user-role {
          font-size: 11px; color: var(--text-muted);
        }

        .collapse-btn {
          padding: 9px; border-radius: 10px;
          border: none; background: none; cursor: pointer;
          color: var(--text-muted); font-size: 14px;
          transition: background 0.15s, transform 0.25s;
          transform: rotate(${collapsed ? 180 : 0}deg);
          align-self: flex-start; margin-left: 4px;
        }
        .collapse-btn:hover { background: var(--hover); }

        .desktop-main {
          margin-left: ${W}px; flex: 1; min-height: 100vh;
          transition: margin-left 0.25s cubic-bezier(0.4,0,0.2,1);
          overflow-y: auto;
        }
      `}</style>

      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="desktop-root">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo" onClick={() => setCollapsed(v => !v)}>🏥</div>
            <span className="sidebar-brand">NewQueue</span>
          </div>

          <nav className="sidebar-nav">
            {items.map(item => {
              const active = location.pathname === item.path
              return (
                <button
                  key={item.path}
                  className={`s-item${active ? ' active' : ''}`}
                  onClick={() => navigate(item.path)}
                  title={collapsed ? item.label : ''}
                >
                  <span className="s-icon">{item.icon}</span>
                  <span className="s-label">{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="sidebar-bottom">
            {/* Theme toggle — collapsed holda faqat icon */}
            <button className="s-theme-icon-btn" onClick={toggle} title={isDark ? 'Kun rejimi' : 'Tun rejimi'}>
              {isDark ? '☀️' : '🌙'}
            </button>
            <div className="s-theme-wrap">
              <ThemeToggle size="sm" />
            </div>

            {/* User */}
            <button className="s-user-btn" onClick={() => setDrawerOpen(true)}>
              <div className="s-avatar">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="s-user-info">
                <div className="s-user-name">{user?.first_name} {user?.last_name}</div>
                <div className="s-user-role">{user?.role === 'ADMIN' ? 'Doktor' : 'Bemor'}</div>
              </div>
            </button>

            <button className="collapse-btn" onClick={() => setCollapsed(v => !v)} title="Yig'ish">
              ◀
            </button>
          </div>
        </aside>

        <main className="desktop-main">{children}</main>
      </div>
    </>
  )
}