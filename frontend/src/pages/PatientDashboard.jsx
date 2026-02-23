import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../api/auth'
import AppointmentsPage from './AppointmentsPage'

export default function PatientDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBooking, setShowBooking] = useState(false)



  useEffect(() => {
    apiFetch('/api/appointments/')
      .then(r => r.json())
      .then(data => setAppointments(Array.isArray(data) ? data : data.results || []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false))
  }, [])

  const upcoming = appointments.filter(a =>
    ['pending', 'confirmed'].includes(a.status)
  ).slice(0, 3)

  const greeting = () => "Assalomu alaykum"

  const quickActions = [
    { icon: '📅', label: 'Navbat olish',  action: () => setShowBooking(true), color: '#00c8aa' },
    { icon: '🏥', label: "Bo'limlar",     path: '/departments',   color: '#5282ff' },
    { icon: '✨', label: 'AI Yordamchi',  path: '/ai',            color: '#a855f7' },
    { icon: '📋', label: 'Tibbiy Daftar', path: '/daftar',        color: '#f59e0b' },
    { icon: '💊', label: 'Retseptlar',    path: '/prescriptions', color: '#10b981' },
    { icon: '👤', label: 'Profil',        path: '/profile',       color: '#ec4899' },
  ]

  const statusMap = {
    pending:   { text: 'Kutilmoqda',    color: '#f59e0b' },
    confirmed: { text: 'Tasdiqlangan',  color: '#10b981' },
    cancelled: { text: 'Bekor qilindi', color: '#ff5050' },
    completed: { text: 'Tugallandi',    color: '#8090a8' },
  }

  if (showBooking) {
    return (
      <div>
        <button onClick={() => setShowBooking(false)} style={{
          margin: '16px 24px',
          padding: '10px 20px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          ← Asosiyga qaytish
        </button>
        <AppointmentsPage />
      </div>
    )
  }

  return (
    <>
      <style>{`
        .dash {
          min-height: 100vh;
          background: var(--bg);
          padding: 28px 24px 48px;
          max-width: 860px;
          margin: 0 auto;
          font-family: 'DM Sans', sans-serif;
        }
        .dash-header {
          display: flex; align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          margin-bottom: 32px;
        }
        .dash-greeting {
          font-family: 'Syne', sans-serif;
          font-size: 26px; font-weight: 800;
          color: var(--text-primary); line-height: 1.2;
        }
        .dash-greeting span {
          background: linear-gradient(90deg, #00c8aa, #5282ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .dash-sub { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
        .dash-clock {
          font-family: 'Syne', sans-serif;
          font-size: 20px; font-weight: 700;
          color: var(--text-secondary);
          letter-spacing: 2px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px; padding: 8px 18px;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px; margin-bottom: 28px;
        }
        @media(max-width:560px){ .stats-row { grid-template-columns: 1fr 1fr; } }

        .stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px; padding: 18px 20px;
          position: relative; overflow: hidden;
          transition: transform 0.2s, border-color 0.2s;
        }
        .stat-card:hover { transform: translateY(-2px); border-color: var(--accent-border); }
        .stat-card::before {
          content: ''; position: absolute;
          top: 0; left: 0; right: 0; height: 3px;
          background: var(--c, #00c8aa);
        }
        .stat-icon { position: absolute; top: 14px; right: 14px; font-size: 20px; opacity: 0.4; }
        .stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 32px; font-weight: 800;
          color: var(--text-primary); line-height: 1;
        }
        .stat-label { font-size: 12px; color: var(--text-muted); margin-top: 6px; }

        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: 12px; font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 1.2px;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .booking-banner {
          background: linear-gradient(135deg, rgba(0,200,170,0.12), rgba(82,130,255,0.08));
          border: 1px solid rgba(0,200,170,0.3);
          border-radius: 18px;
          padding: 22px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 28px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .booking-banner:hover {
          border-color: rgba(0,200,170,0.5);
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,200,170,0.1);
        }
        .booking-banner-left { display: flex; align-items: center; gap: 16px; }
        .booking-banner-icon {
          width: 52px; height: 52px; border-radius: 16px;
          background: linear-gradient(135deg, #00c8aa, #0090a0);
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; flex-shrink: 0;
        }
        .booking-banner-title {
          font-family: 'Syne', sans-serif;
          font-size: 17px; font-weight: 800;
          color: var(--text-primary); margin-bottom: 4px;
        }
        .booking-banner-sub { font-size: 13px; color: var(--text-muted); }
        .booking-banner-btn {
          padding: 12px 22px;
          background: linear-gradient(135deg, #00c8aa, #0090a0);
          border: none; border-radius: 12px;
          color: #fff; font-family: 'Syne', sans-serif;
          font-size: 14px; font-weight: 700;
          cursor: pointer; white-space: nowrap;
          transition: opacity 0.2s, transform 0.15s;
          flex-shrink: 0;
        }
        .booking-banner-btn:hover { opacity: 0.9; transform: scale(1.03); }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px; margin-bottom: 28px;
        }
        @media(max-width:480px){ .actions-grid { grid-template-columns: repeat(2,1fr); } }

        .action-btn {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px; padding: 18px 12px;
          cursor: pointer; text-align: center;
          display: flex; flex-direction: column;
          align-items: center; gap: 10px;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          position: relative; overflow: hidden;
        }
        .action-btn:hover {
          transform: translateY(-3px);
          border-color: var(--btn-color, #00c8aa);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
          background: var(--btn-dim);
        }
        .a-icon-wrap {
          width: 46px; height: 46px; border-radius: 14px;
          background: var(--surface-2);
          display: flex; align-items: center;
          justify-content: center; font-size: 22px;
          transition: transform 0.2s;
        }
        .action-btn:hover .a-icon-wrap { transform: scale(1.12); }
        .a-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }

        .appt-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
        .appt-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px; padding: 14px 18px;
          display: flex; align-items: center; gap: 14px;
          cursor: pointer;
          transition: border-color 0.2s, transform 0.2s;
        }
        .appt-card:hover { border-color: var(--accent-border); transform: translateX(3px); }
        .appt-date-box {
          min-width: 48px; text-align: center;
          background: var(--accent-dim);
          border: 1px solid var(--accent-border);
          border-radius: 12px; padding: 8px 6px;
        }
        .appt-day {
          font-family: 'Syne', sans-serif;
          font-size: 20px; font-weight: 800;
          color: var(--accent); line-height: 1;
        }
        .appt-month { font-size: 10px; color: var(--accent); text-transform: uppercase; }
        .appt-info { flex: 1; }
        .appt-doctor { font-size: 14px; font-weight: 600; color: var(--text-primary); }
        .appt-dept { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        .appt-time { font-size: 12px; color: var(--text-secondary); margin-top: 3px; }
        .appt-badge {
          font-size: 11px; font-weight: 600;
          padding: 3px 10px; border-radius: 20px; border: 1px solid;
          white-space: nowrap;
        }

        .empty-box {
          text-align: center; padding: 32px 16px;
          background: var(--surface);
          border: 1px dashed var(--border);
          border-radius: 16px;
        }
        .empty-box p { font-size: 14px; color: var(--text-muted); margin: 8px 0 16px; }
        .empty-box button {
          padding: 10px 22px; border-radius: 10px;
          background: linear-gradient(135deg, #00c8aa, #00a88c);
          border: none; color: #fff;
          font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: inherit;
        }

        .ai-banner {
          background: linear-gradient(135deg, rgba(0,200,170,0.08), rgba(82,130,255,0.06));
          border: 1px solid rgba(0,200,170,0.2);
          border-radius: 16px; padding: 20px 22px;
          display: flex; align-items: center; gap: 16px;
          cursor: pointer;
          transition: border-color 0.2s, transform 0.2s;
        }
        .ai-banner:hover { border-color: rgba(0,200,170,0.4); transform: translateY(-2px); }
        .ai-banner-icon {
          width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
          background: linear-gradient(135deg, rgba(0,200,170,0.2), rgba(82,130,255,0.2));
          display: flex; align-items: center; justify-content: center;
          font-size: 24px;
        }
        .ai-banner h4 {
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 700; color: var(--text-primary);
        }
        .ai-banner p { font-size: 12px; color: var(--text-muted); margin-top: 3px; }
        .ai-arr { margin-left: auto; font-size: 20px; color: var(--accent); transition: transform 0.2s; }
        .ai-banner:hover .ai-arr { transform: translateX(5px); }

        .skeleton {
          height: 68px; border-radius: 14px;
          background: linear-gradient(90deg, var(--surface) 25%, var(--hover) 50%, var(--surface) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      <div className="dash">
        {/* Header */}
        <div className="dash-header">
          <div>
            <div className="dash-greeting">
              {greeting()}, <span>{user?.first_name}</span> 👋
            </div>

          </div>

        </div>

        {/* Stats */}
        <div className="stats-row">
          {[
            { c: '#00c8aa', icon: '📅', val: appointments.filter(a => a.status === 'pending').length,   label: "Kutilayotgan" },
            { c: '#10b981', icon: '✅', val: appointments.filter(a => a.status === 'completed').length, label: "Tugallangan" },
            { c: '#5282ff', icon: '📋', val: appointments.length,                                       label: "Jami navbat" },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ '--c': s.c }}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Navbat olish banner */}
        <div className="booking-banner" onClick={() => setShowBooking(true)}>
          <div className="booking-banner-left">
            <div className="booking-banner-icon">📅</div>
            <div>
              <div className="booking-banner-title">Navbat oling</div>
              <div className="booking-banner-sub">Shifokor bilan tezda uchrashing</div>
            </div>
          </div>
          <button className="booking-banner-btn" onClick={() => setShowBooking(true)}>
            Navbat olish →
          </button>
        </div>

        {/* Quick actions */}
        <div className="section-title">Tezkor harakatlar</div>
        <div className="actions-grid">
          {quickActions.map((a, i) => (
            <button
              key={i}
              className="action-btn"
              style={{ '--btn-color': a.color, '--btn-dim': a.color + '14' }}
              onClick={() => a.action ? a.action() : navigate(a.path)}
            >
              <div className="a-icon-wrap">{a.icon}</div>
              <span className="a-label">{a.label}</span>
            </button>
          ))}
        </div>

        {/* Upcoming appointments */}
        <div className="section-title">Yaqinlashayotgan navbatlar</div>
        <div className="appt-list">
          {loading ? (
            [1, 2].map(i => <div key={i} className="skeleton" />)
          ) : upcoming.length === 0 ? (
            <div className="empty-box">
              <div style={{ fontSize: 34 }}>📭</div>
              <p>Hozircha navbat yo'q</p>
              <button onClick={() => setShowBooking(true)}>+ Navbat olish</button>
            </div>
          ) : (
            upcoming.map((a, i) => {
              const d = new Date(a.appointment_date || a.date || Date.now())
              const st = statusMap[a.status] || { text: a.status, color: '#8090a8' }
              return (
                <div key={i} className="appt-card" onClick={() => navigate('/appointments')}>
                  <div className="appt-date-box">
                    <div className="appt-day">{d.getDate()}</div>
                    <div className="appt-month">{d.toLocaleDateString('uz-UZ', { month: 'short' })}</div>
                  </div>
                  <div className="appt-info">
                    <div className="appt-doctor">{a.doctor_name || a.doctor?.name || 'Doktor'}</div>
                    <div className="appt-dept">{a.department_name || a.doctor?.department || ''}</div>
                    <div className="appt-time">🕐 {a.appointment_time || a.time || '—'}</div>
                  </div>
                  <div className="appt-badge" style={{
                    color: st.color,
                    borderColor: st.color + '44',
                    background: st.color + '14',
                  }}>
                    {st.text}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* AI Banner */}
        <div className="ai-banner" onClick={() => navigate('/ai')}>
          <div className="ai-banner-icon">✨</div>
          <div>
            <h4>AI Tibbiy Yordamchi</h4>
            <p>Tibbiy savollaringizga darhol javob oling</p>
          </div>
          <div className="ai-arr">→</div>
        </div>
      </div>
    </>
  )
}