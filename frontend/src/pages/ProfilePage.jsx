import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'   // ← QO'SHILDI
import { apiFetch } from '../api/auth'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  .pf-root {
    min-height: 100vh;
    background: #060810;
    font-family: 'Outfit', sans-serif;
    color: #e8eaf0;
    padding-bottom: 80px;
    position: relative;
    overflow-x: hidden;
  }
  .pf-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(32,196,180,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(32,196,180,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }
  .pf-inner {
    position: relative;
    z-index: 1;
    max-width: 680px;
    margin: 0 auto;
    padding: 0 16px;
  }

  .pf-hero {
    padding: 40px 0 28px;
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .pf-avatar {
    width: 72px;
    height: 72px;
    border-radius: 20px;
    background: linear-gradient(135deg, #20c4b4, #0e8a80);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    font-weight: 800;
    color: #fff;
    flex-shrink: 0;
    box-shadow: 0 0 40px rgba(32,196,180,0.25);
    letter-spacing: -1px;
  }
  .pf-hero-info h1 {
    font-size: 24px;
    font-weight: 800;
    color: #fff;
    margin-bottom: 4px;
    letter-spacing: -0.5px;
  }
  .pf-role {
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    color: #20c4b4;
    background: rgba(32,196,180,0.1);
    border: 1px solid rgba(32,196,180,0.2);
    padding: 3px 10px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 4px;
  }
  .pf-phone {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #6b7280;
  }

  /* THEME TOGGLE */                              /* ← QO'SHILDI */
  .pf-theme-btn {
    margin-left: auto;
    padding: 8px 14px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: #e8eaf0;
    font-size: 18px;
    cursor: pointer;
    transition: background 0.2s;
    flex-shrink: 0;
  }
  .pf-theme-btn:hover { background: rgba(255,255,255,0.1); }

  .pf-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 18px;
    margin-bottom: 14px;
    overflow: hidden;
  }
  .pf-card-title {
    font-size: 11px;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    padding: 16px 18px 0;
    margin-bottom: 4px;
  }

  .pf-field {
    padding: 10px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .pf-field:last-child { border-bottom: none; }
  .pf-field-label { font-size: 13px; color: #6b7280; flex-shrink: 0; }
  .pf-field-val {
    font-size: 13px;
    font-weight: 500;
    color: #e8eaf0;
    font-family: 'JetBrains Mono', monospace;
    text-align: right;
  }
  .pf-field-empty { color: #374151; font-style: italic; }

  .pf-form { padding: 14px 18px; }
  .pf-input-group { margin-bottom: 14px; }
  .pf-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 6px;
  }
  .pf-input {
    width: 100%;
    padding: 11px 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: #e8eaf0;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }
  .pf-input:focus { border-color: rgba(32,196,180,0.4); }
  .pf-select {
    width: 100%;
    padding: 11px 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: #e8eaf0;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    outline: none;
    cursor: pointer;
  }
  .pf-select option { background: #0f1117; }
  .pf-textarea {
    width: 100%;
    padding: 11px 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: #e8eaf0;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    outline: none;
    resize: vertical;
    min-height: 80px;
    transition: border-color 0.2s;
  }
  .pf-textarea:focus { border-color: rgba(32,196,180,0.4); }

  .pf-btn-edit {
    width: 100%;
    padding: 14px;
    background: rgba(32,196,180,0.1);
    border: 1px solid rgba(32,196,180,0.25);
    border-radius: 12px;
    color: #20c4b4;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    margin-bottom: 10px;
    transition: background 0.2s;
  }
  .pf-btn-edit:hover { background: rgba(32,196,180,0.18); }
  .pf-btn-save {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #20c4b4, #0e8a80);
    border: none;
    border-radius: 12px;
    color: #fff;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    margin-bottom: 10px;
    box-shadow: 0 4px 20px rgba(32,196,180,0.2);
    transition: opacity 0.2s;
  }
  .pf-btn-save:hover { opacity: 0.9; }
  .pf-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
  .pf-btn-cancel {
    width: 100%;
    padding: 12px;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    color: #6b7280;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    cursor: pointer;
  }

  .pf-success {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(16,185,129,0.1);
    border: 1px solid rgba(16,185,129,0.2);
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 16px;
    font-size: 13px;
    color: #10b981;
  }
  .pf-error {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.2);
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 16px;
    font-size: 13px;
    color: #ef4444;
  }

  .glow-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(32,196,180,0.3), transparent);
    margin: 20px 0;
  }

  .skel {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
  }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }


  [data-theme="light"] .pf-root {
    background: #f0f4f8;
    color: #111827;
  }
  [data-theme="light"] .pf-root::before {
    background-image:
      linear-gradient(rgba(0,150,136,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,150,136,0.05) 1px, transparent 1px);
  }
  [data-theme="light"] .pf-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
  }
  [data-theme="light"] .pf-card-title { color: #6b7280; }
  [data-theme="light"] .pf-hero-info h1 { color: #111827; }
  [data-theme="light"] .pf-field-label { color: #6b7280; }
  [data-theme="light"] .pf-field-val { color: #111827; }
  [data-theme="light"] .pf-field { border-bottom: 1px solid #f3f4f6; }
  [data-theme="light"] .pf-field-empty { color: #9ca3af; }
  [data-theme="light"] .pf-input {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    color: #111827;
  }
  [data-theme="light"] .pf-select {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    color: #111827;
  }
  [data-theme="light"] .pf-select option { background: #ffffff; }
  [data-theme="light"] .pf-textarea {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    color: #111827;
  }
  [data-theme="light"] .pf-label { color: #6b7280; }
  [data-theme="light"] .pf-theme-btn {
    background: rgba(0,0,0,0.05);
    border: 1px solid rgba(0,0,0,0.1);
    color: #111827;
  }
  [data-theme="light"] .pf-btn-cancel {
    border: 1px solid #e5e7eb;
    color: #6b7280;
  }
  [data-theme="light"] .skel {
    background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
`


const GENDER_MAP = { M: 'Erkak', F: 'Ayol', '': '—' }
const BLOOD_TYPES = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const { theme, toggle } = useTheme()              // ← QO'SHILDI
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    date_of_birth: '',
    gender: '',
    address: '',
    blood_type: '',
    allergies: '',
    chronic_diseases: '',
  })

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        date_of_birth: user.date_of_birth || '',
        gender: user.patient_profile?.gender || '',
        address: user.patient_profile?.address || '',
        blood_type: user.patient_profile?.blood_type || '',
        allergies: user.patient_profile?.allergies || '',
        chronic_diseases: user.patient_profile?.chronic_diseases || '',
      })
    }
  }, [user])

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

 const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const userRes = await apiFetch('/api/auth/me/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          date_of_birth: form.date_of_birth || null,
        })
      })

      const profileRes = await apiFetch('/api/auth/profile/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender: form.gender,
          address: form.address,
          blood_type: form.blood_type,
          allergies: form.allergies,
          chronic_diseases: form.chronic_diseases,
        })
      })

      if (userRes.ok && profileRes.ok) {
        const freshRes = await apiFetch('/api/auth/me/')
        const freshUser = await freshRes.json()
        if (setUser) setUser(freshUser)
        setSuccess(true)
        setEditing(false)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError("Saqlashda xatolik yuz berdi")
      }
    } catch {
      setError("Tarmoq xatosi. Qaytadan urinib ko'ring.")
    } finally {
      setSaving(false)
    }
  }

  if (!user) return (
    <>
      <style>{CSS}</style>
      <div className="pf-root">
        <div className="pf-inner" style={{ paddingTop: 40 }}>
          {[1,2,3].map(i => (
            <div key={i} className="pf-card" style={{ padding: 20, marginBottom: 14 }}>
              <div className="skel" style={{ height: 16, width: '40%', marginBottom: 12 }} />
              <div className="skel" style={{ height: 14, width: '70%', marginBottom: 8 }} />
              <div className="skel" style={{ height: 14, width: '55%' }} />
            </div>
          ))}
        </div>
      </div>
    </>
  )

  const p = user.patient_profile

  return (
    <>
      <style>{CSS}</style>
      <div className="pf-root">
        <div className="pf-inner">

          {/* HERO */}
          <div className="pf-hero">
            <div className="pf-avatar">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <div className="pf-hero-info">
              <div className="pf-role">{user.role === 'ADMIN' ? 'Doktor' : 'Bemor'}</div>
              <h1>{user.first_name} {user.last_name}</h1>
              <div className="pf-phone">{user.phone_number}</div>
            </div>

            {/* TOGGLE TUGMA ← QO'SHILDI */}
            <button className="pf-theme-btn" onClick={toggle} title="Tema o'zgartirish">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>

          {success && <div className="pf-success">✅ Profil muvaffaqiyatli saqlandi!</div>}
          {error   && <div className="pf-error">⚠️ {error}</div>}

          {!editing ? (
            <>
              <div className="pf-card">
                <div className="pf-card-title">👤 Shaxsiy ma'lumotlar</div>
                <Field label="Ism"           value={user.first_name} />
                <Field label="Familiya"      value={user.last_name} />
                <Field label="Telefon"       value={user.phone_number} />
                <Field label="Email"         value={user.email} />
                <Field label="Tug'ilgan sana" value={user.date_of_birth} />
              </div>

              {p && (
                <div className="pf-card">
                  <div className="pf-card-title">🏥 Tibbiy ma'lumotlar</div>
                  <Field label="Jinsi"                value={GENDER_MAP[p.gender] || '—'} />
                  <Field label="Qon guruhi"           value={p.blood_type} />
                  <Field label="Manzil"               value={p.address} />
                  <Field label="Allergiyalar"          value={p.allergies} />
                  <Field label="Surunkali kasalliklar" value={p.chronic_diseases} />
                  {p.notes && <Field label="Doktor eslatmasi" value={p.notes} />}
                </div>
              )}

              <div className="glow-line" />
              <button className="pf-btn-edit" onClick={() => setEditing(true)}>
                ✏️ Profilni tahrirlash
              </button>
            </>
          ) : (
            <>
              <div className="pf-card">
                <div className="pf-card-title">👤 Shaxsiy ma'lumotlar</div>
                <div className="pf-form">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="pf-input-group">
                      <label className="pf-label">Ism</label>
                      <input className="pf-input" name="first_name" value={form.first_name} onChange={handleChange} />
                    </div>
                    <div className="pf-input-group">
                      <label className="pf-label">Familiya</label>
                      <input className="pf-input" name="last_name" value={form.last_name} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="pf-input-group">
                    <label className="pf-label">Email</label>
                    <input className="pf-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" />
                  </div>
                  <div className="pf-input-group">
                    <label className="pf-label">Tug'ilgan sana</label>
                    <input className="pf-input" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="pf-card">
                <div className="pf-card-title">🏥 Tibbiy ma'lumotlar</div>
                <div className="pf-form">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="pf-input-group">
                      <label className="pf-label">Jinsi</label>
                      <select className="pf-select" name="gender" value={form.gender} onChange={handleChange}>
                        <option value="">Tanlanmagan</option>
                        <option value="M">Erkak</option>
                        <option value="F">Ayol</option>
                      </select>
                    </div>
                    <div className="pf-input-group">
                      <label className="pf-label">Qon guruhi</label>
                      <select className="pf-select" name="blood_type" value={form.blood_type} onChange={handleChange}>
                        {BLOOD_TYPES.map(b => <option key={b} value={b}>{b || 'Tanlanmagan'}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="pf-input-group">
                    <label className="pf-label">Manzil</label>
                    <input className="pf-input" name="address" value={form.address} onChange={handleChange} placeholder="Shahar, ko'cha, uy" />
                  </div>
                  <div className="pf-input-group">
                    <label className="pf-label">Allergiyalar</label>
                    <textarea className="pf-textarea" name="allergies" value={form.allergies} onChange={handleChange} placeholder="Mavjud allergiyalar..." />
                  </div>
                  <div className="pf-input-group">
                    <label className="pf-label">Surunkali kasalliklar</label>
                    <textarea className="pf-textarea" name="chronic_diseases" value={form.chronic_diseases} onChange={handleChange} placeholder="Mavjud kasalliklar..." />
                  </div>
                </div>
              </div>

              <button className="pf-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ Saqlanmoqda...' : '💾 Saqlash'}
              </button>
              <button className="pf-btn-cancel" onClick={() => { setEditing(false); setError(null) }}>
                Bekor qilish
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function Field({ label, value }) {
  return (
    <div className="pf-field">
      <span className="pf-field-label">{label}</span>
      <span className={`pf-field-val ${!value ? 'pf-field-empty' : ''}`}>
        {value || 'Kiritilmagan'}
      </span>
    </div>
  )
}