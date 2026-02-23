import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../ui/ThemeToggle'

export default function DrawerMenu({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const menuItems = [
      { icon: '💊', label: 'Retseptlar',                action: () => navigate('/prescriptions') },
    { icon: '👤', label: "Shaxsiy ma'lumotlar",      action: () => navigate('/profile') },
    { icon: '✏️', label: 'Profilni tahrirlash',       action: () => navigate('/profile/edit') },
    { icon: '🌐', label: "Ilova tilini o'zgartirish", action: () => {} },
    { icon: '💬', label: 'Yordam (Telegram)',          action: () => window.open('https://t.me/support') },
    { icon: '🗑️', label: 'Keshni tozalash',           action: () => { localStorage.clear(); window.location.reload() } },
    { icon: 'ℹ️', label: 'Ilova haqida',              action: () => {} },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700&display=swap');

        .drawer-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.55);
          opacity: 0; pointer-events: none;
          transition: opacity 0.3s;
          backdrop-filter: blur(3px);
        }
        .drawer-overlay.open { opacity: 1; pointer-events: all; }

        .drawer {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: 290px; z-index: 101;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          transform: translateX(-100%);
          transition: transform 0.32s cubic-bezier(0.4,0,0.2,1);
          box-shadow: var(--shadow);
        }
        .drawer.open { transform: translateX(0); }

        .drawer-header {
          padding: 44px 20px 20px;
          border-bottom: 1px solid var(--border);
        }
        .drawer-avatar {
          width: 60px; height: 60px; border-radius: 18px;
          background: linear-gradient(135deg, #00c8aa, #5282ff);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 700; color: #fff;
          font-family: 'Syne', sans-serif;
          margin-bottom: 14px;
          box-shadow: 0 4px 16px rgba(0,200,170,0.25);
        }
        .drawer-name {
          font-family: 'Syne', sans-serif;
          font-size: 16px; font-weight: 700;
          color: var(--text-primary); margin-bottom: 6px;
        }
        .drawer-meta {
          display: flex; flex-direction: column; gap: 3px;
          font-size: 12px; color: var(--text-muted);
        }
        .drawer-role {
          display: inline-flex; align-items: center; gap: 4px;
          margin-top: 8px; padding: 3px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 600;
          background: var(--accent-dim);
          color: var(--accent);
          border: 1px solid var(--accent-border);
        }

        .drawer-menu {
          flex: 1; padding: 12px 10px;
          overflow-y: auto; display: flex; flex-direction: column; gap: 1px;
        }
        .drawer-item {
          display: flex; align-items: center; gap: 13px;
          padding: 11px 12px; border-radius: 11px;
          cursor: pointer; border: none;
          background: none; width: 100%; text-align: left;
          color: var(--text-secondary); font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.15s, color 0.15s;
        }
        .drawer-item:hover { background: var(--hover); color: var(--text-primary); }
        .d-icon { font-size: 17px; width: 22px; text-align: center; flex-shrink: 0; }

        .drawer-divider {
          height: 1px; background: var(--border);
          margin: 8px 10px;
        }

        .theme-wrap { padding: 0 12px; }

        .drawer-footer {
          padding: 12px 10px 32px;
          border-top: 1px solid var(--border);
        }
        .drawer-logout {
          display: flex; align-items: center; gap: 13px;
          padding: 12px 12px; border-radius: 11px;
          cursor: pointer; border: none; width: 100%;
          background: var(--danger-dim);
          color: var(--danger);
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          transition: background 0.15s; font-weight: 500;
        }
        .drawer-logout:hover { background: rgba(255,80,80,0.16); }
      `}</style>

      <div className={`drawer-overlay${open ? ' open' : ''}`} onClick={onClose} />

      <div className={`drawer${open ? ' open' : ''}`}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-avatar">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="drawer-name">{user?.first_name} {user?.last_name}</div>
          <div className="drawer-meta">
            <span>📞 {user?.phone_number}</span>
            {user?.email && <span>✉ {user?.email}</span>}
          </div>
          <div className="drawer-role">
            {user?.role === 'ADMIN' ? '🩺 Doktor' : '👤 Bemor'}
          </div>
        </div>

        {/* Menu */}
        <div className="drawer-menu">
          {menuItems.map(item => (
            <button key={item.label} className="drawer-item"
              onClick={() => { item.action(); onClose() }}>
              <span className="d-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="drawer-divider" />

          {/* 🌙☀️ Theme toggle */}
          <div className="theme-wrap">
            <ThemeToggle />
          </div>
        </div>

        {/* Logout */}
        <div className="drawer-footer">
          <button className="drawer-logout" onClick={handleLogout}>
            <span>⎋</span> Profildan chiqish
          </button>
        </div>
      </div>
    </>
  )
}