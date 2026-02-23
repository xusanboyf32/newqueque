import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function formatPhone(val) {
  let digits = val.replace(/\D/g, '')
  if (!digits.startsWith('998')) digits = '998'
  digits = digits.slice(0, 12)
  return '+' + digits
}

export default function LoginPage() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const location     = useLocation()
  const from         = location.state?.from?.pathname

  const [form, setForm]     = useState({ phone_number: '+998', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const validate = () => {
    const e = {}
    if (form.phone_number.length !== 13) e.phone_number = "To'liq raqam kiriting (+998XXXXXXXXX)"
    if (!form.password) e.password = 'Parolni kiriting'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const v = validate()
    if (Object.keys(v).length) { setErrors(v); return }
    setLoading(true)
    setErrors({})
    try {
      const user = await login(form)
      const dest = from || (user.role === 'ADMIN' ? '/dashboard/doctor' : '/dashboard/patient')
      navigate(dest, { replace: true })
    } catch (err) {
      const msg = err?.non_field_errors?.[0] || err?.detail || "Telefon yoki parol noto'g'ri"
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="auth-root">

        {/* ── CHAP PANEL ── */}
        <div className="auth-left">
          <div className="grid-bg" />
          <div className="glow glow-1" />
          <div className="glow glow-2" />

          <div className="brand">
            <div className="brand-icon">🏥</div>
            <span className="brand-name">NewQueue</span>
          </div>

          <div className="hero-text">
            <h1>Zamonaviy<br />Poliklinika<br />Tizimi</h1>
            <p>Navbat olish, retsept ko'rish va doktor bilan bog'lanish — hammasi bir joyda.</p>
          </div>

          <div className="stats-row">
            {[['12k+','Bemorlar'],['98%','Mamnunlik'],['24/7','Xizmat']].map(([v,l]) => (
              <div className="stat-card" key={l}>
                <div className="stat-val">{v}</div>
                <div className="stat-lbl">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── O'NG PANEL ── */}
        <div className="auth-right">
          <div className="form-card">
            <h2 className="form-title">Kirish</h2>
            <p className="form-sub">
              Hisob yo'qmi? <Link to="/register">Ro'yxatdan o'ting</Link>
            </p>

            {errors.general && (
              <div className="error-box">⚠ {errors.general}</div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label className="field-lbl">Telefon raqam</label>
                <input
                  className={`field-inp${errors.phone_number ? ' err' : ''}`}
                  type="tel"
                  value={form.phone_number}
                  onChange={(e) => setForm(f => ({ ...f, phone_number: formatPhone(e.target.value) }))}
                  placeholder="+998901234567"
                  autoFocus
                />
                {errors.phone_number && <span className="field-err">{errors.phone_number}</span>}
              </div>

              <div className="field">
                <label className="field-lbl">Parol</label>
                <div className="pass-wrap">
                  <input
                    className={`field-inp${errors.password ? ' err' : ''}`}
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" className="eye-btn"
                    onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
                {errors.password && <span className="field-err">{errors.password}</span>}
              </div>

              <button className="btn-submit" type="submit" disabled={loading}>
                {loading && <span className="btn-spin" />}
                {loading ? 'Tekshirilmoqda...' : 'Kirish'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .auth-root {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    font-family: 'DM Sans', sans-serif;
    color: #e8ecf4;
    background: #070b14;
  }

  /* CHAP */
  .auth-left {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px 52px;
    background: #0b1221;
    border-right: 1px solid rgba(255,255,255,0.05);
    overflow: hidden;
  }
  .grid-bg {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
  }
  .glow {
    position: absolute; border-radius: 50%; pointer-events: none;
  }
  .glow-1 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(0,200,170,0.1) 0%, transparent 70%);
    top: -120px; left: -80px;
  }
  .glow-2 {
    width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(82,130,255,0.08) 0%, transparent 70%);
    bottom: 40px; right: -60px;
  }
  .brand {
    display: flex; align-items: center; gap: 12px; z-index: 1;
  }
  .brand-icon {
    width: 40px; height: 40px;
    background: linear-gradient(135deg, #00c8aa, #5282ff);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
  }
  .brand-name {
    font-family: 'Syne', sans-serif;
    font-size: 20px; font-weight: 700;
    background: linear-gradient(90deg, #fff, #8090b0);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .hero-text { z-index: 1; }
  .hero-text h1 {
    font-family: 'Syne', sans-serif;
    font-size: 44px; font-weight: 800;
    line-height: 1.13; letter-spacing: -1.5px;
    background: linear-gradient(135deg, #fff 0%, #6080a0 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 20px;
  }
  .hero-text p {
    font-size: 15px; color: #4a5870; line-height: 1.7; max-width: 300px;
  }
  .stats-row { display: flex; gap: 16px; z-index: 1; }
  .stat-card {
    flex: 1;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    padding: 18px 16px;
  }
  .stat-val {
    font-family: 'Syne', sans-serif;
    font-size: 26px; font-weight: 700;
    color: #00c8aa; letter-spacing: -1px;
  }
  .stat-lbl {
    font-size: 11px; color: #3a4a60;
    text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;
  }

  /* O'NG */
  .auth-right {
    display: flex; align-items: center; justify-content: center;
    padding: 40px;
  }
  .form-card {
    width: 100%; max-width: 380px;
    animation: fadeUp 0.4s ease both;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .form-title {
    font-family: 'Syne', sans-serif;
    font-size: 28px; font-weight: 700; letter-spacing: -0.8px;
    color: #e8ecf4; margin-bottom: 8px;
  }
  .form-sub { font-size: 14px; color: #4a5870; margin-bottom: 32px; }
  .form-sub a { color: #00c8aa; text-decoration: none; font-weight: 500; }
  .form-sub a:hover { text-decoration: underline; }

  .error-box {
    background: rgba(255,80,80,0.08);
    border: 1px solid rgba(255,80,80,0.2);
    border-radius: 10px; padding: 12px 16px;
    font-size: 13px; color: #ff7070; margin-bottom: 20px;
  }

  .field { margin-bottom: 20px; }
  .field-lbl {
    display: block; font-size: 11px; font-weight: 500;
    text-transform: uppercase; letter-spacing: 0.8px;
    color: #4a5870; margin-bottom: 8px;
  }
  .pass-wrap { position: relative; }
  .field-inp {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 14px 16px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px; color: #e8ecf4; outline: none;
    transition: border-color 0.2s, background 0.2s;
  }
  .field-inp::placeholder { color: #2a3848; }
  .field-inp:focus {
    border-color: rgba(0,200,170,0.45);
    background: rgba(0,200,170,0.04);
  }
  .field-inp.err { border-color: rgba(255,80,80,0.45); }
  .field-err { display: block; font-size: 12px; color: #ff5050; margin-top: 6px; }

  .eye-btn {
    position: absolute; right: 12px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: #4a5870; font-size: 16px;
    padding: 4px; transition: color 0.2s;
  }
  .eye-btn:hover { color: #00c8aa; }

  .btn-submit {
    width: 100%; padding: 15px;
    background: linear-gradient(135deg, #00c8aa, #00a88c);
    border: none; border-radius: 12px;
    font-family: 'Syne', sans-serif;
    font-size: 15px; font-weight: 600;
    color: #060a12; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    margin-top: 8px; display: flex;
    align-items: center; justify-content: center; gap: 8px;
  }
  .btn-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
  .btn-submit:active:not(:disabled) { transform: translateY(0); }
  .btn-submit:disabled { opacity: 0.45; cursor: not-allowed; }

  .btn-spin {
    width: 15px; height: 15px;
    border: 2px solid rgba(0,0,0,0.25);
    border-top-color: #060a12;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 768px) {
    .auth-root { grid-template-columns: 1fr; }
    .auth-left { display: none; }
    .auth-right { padding: 28px 20px; }
  }
`

