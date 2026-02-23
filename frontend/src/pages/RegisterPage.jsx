import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function formatPhone(val) {
  let digits = val.replace(/\D/g, '')
  if (!digits.startsWith('998')) digits = '998'
  digits = digits.slice(0, 12)
  return '+' + digits
}

const STEPS = ['Shaxsiy', 'Kontakt', 'Parol']

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [step, setStep]     = useState(0)
  const [form, setForm]     = useState({
    first_name: '', last_name: '', date_of_birth: '',
    phone_number: '+998', password: '', password2: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const validateStep = () => {
    const e = {}
    if (step === 0) {
      if (!form.first_name.trim()) e.first_name = 'Ismni kiriting'
      if (!form.last_name.trim())  e.last_name  = 'Familiyani kiriting'
    }
    if (step === 1) {
      if (form.phone_number.length !== 13) e.phone_number = "To'liq raqam kiriting"
    }
    if (step === 2) {
      if (form.password.length < 8)          e.password  = 'Kamida 8 ta belgi'
      if (form.password !== form.password2)  e.password2 = 'Parollar mos emas'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validateStep()) setStep(s => s + 1) }
  const back = () => { setErrors({}); setStep(s => s - 1) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep()) return
    setLoading(true)
    try {
      const user = await register(form)
      navigate(user.role === 'ADMIN' ? '/dashboard/doctor' : '/dashboard/patient', { replace: true })
    } catch (err) {
      const firstVal = Object.values(err || {})[0]
      const msg = Array.isArray(firstVal) ? firstVal[0] : firstVal || 'Xatolik yuz berdi'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="reg-root">
        <div className="glow glow-1" />
        <div className="glow glow-2" />

        <div className="reg-card">
          {/* Brand */}
          <div className="brand">
            <div className="brand-icon">🏥</div>
            <span className="brand-name">NewQueue</span>
          </div>

          {/* Progress bar */}
          <div className="steps-bar">
            {STEPS.map((label, i) => (
              <div key={i} className={`seg${i < step ? ' done' : i === step ? ' active' : ''}`} />
            ))}
          </div>
          <div className="step-meta">
            Qadam {step + 1} / {STEPS.length} — <strong>{STEPS[step]}</strong>
          </div>

          <h2 className="form-title">
            {step === 0 ? 'Ismingiz' : step === 1 ? 'Telefon raqam' : 'Parol yarating'}
          </h2>
          <p className="form-sub">
            {step === 2
              ? <><Link to="/login">Hisobingiz bor?</Link> Kiring</>
              : "Hisob ochish uchun ma'lumotlarni kiriting"}
          </p>

          {errors.general && <div className="error-box">⚠ {errors.general}</div>}

          <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); next() }} noValidate>

            {/* STEP 0 — Shaxsiy */}
            {step === 0 && (
              <>
                <div className="row-2">
                  <div className="field">
                    <label className="field-lbl">Ism</label>
                    <input className={`field-inp${errors.first_name ? ' err' : ''}`}
                      value={form.first_name} onChange={set('first_name')}
                      placeholder="Alibek" autoFocus />
                    {errors.first_name && <span className="field-err">{errors.first_name}</span>}
                  </div>
                  <div className="field">
                    <label className="field-lbl">Familiya</label>
                    <input className={`field-inp${errors.last_name ? ' err' : ''}`}
                      value={form.last_name} onChange={set('last_name')}
                      placeholder="Yusupov" />
                    {errors.last_name && <span className="field-err">{errors.last_name}</span>}
                  </div>
                </div>
                <div className="field">
                  <label className="field-lbl">Tug'ilgan sana (ixtiyoriy)</label>
                  <input className="field-inp" type="date"
                    value={form.date_of_birth} onChange={set('date_of_birth')} />
                </div>
              </>
            )}

            {/* STEP 1 — Kontakt */}
            {step === 1 && (
              <div className="field">
                <label className="field-lbl">Telefon raqam</label>
                <input
                  className={`field-inp${errors.phone_number ? ' err' : ''}`}
                  type="tel" autoFocus
                  value={form.phone_number}
                  onChange={(e) => setForm(f => ({ ...f, phone_number: formatPhone(e.target.value) }))}
                  placeholder="+998901234567"
                />
                {errors.phone_number && <span className="field-err">{errors.phone_number}</span>}
              </div>
            )}

            {/* STEP 2 — Parol */}
            {step === 2 && (
              <>
                <div className="field">
                  <label className="field-lbl">Parol</label>
                  <div className="pass-wrap">
                    <input
                      className={`field-inp${errors.password ? ' err' : ''}`}
                      type={showPass ? 'text' : 'password'} autoFocus
                      value={form.password} onChange={set('password')}
                      placeholder="Kamida 8 ta belgi"
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" className="eye-btn"
                      onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                      {showPass ? '🙈' : '👁'}
                    </button>
                  </div>
                  {errors.password && <span className="field-err">{errors.password}</span>}
                </div>
                <div className="field">
                  <label className="field-lbl">Parolni tasdiqlang</label>
                  <input
                    className={`field-inp${errors.password2 ? ' err' : ''}`}
                    type={showPass ? 'text' : 'password'}
                    value={form.password2} onChange={set('password2')}
                    placeholder="••••••••"
                  />
                  {errors.password2 && <span className="field-err">{errors.password2}</span>}
                </div>
              </>
            )}

            <div className="btn-row">
              {step > 0 && (
                <button type="button" className="btn-back" onClick={back}>← Orqaga</button>
              )}
              <button className="btn-submit" type="submit" disabled={loading}>
                {loading && <span className="btn-spin" />}
                {step < 2 ? 'Keyingisi →' : loading ? 'Yuklanmoqda...' : "Ro'yxatdan o'tish"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .reg-root {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 40px 20px;
    background: #070b14;
    font-family: 'DM Sans', sans-serif;
    color: #e8ecf4;
    position: relative; overflow: hidden;
  }
  .glow {
    position: fixed; border-radius: 50%; pointer-events: none;
  }
  .glow-1 {
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(0,200,170,0.07) 0%, transparent 65%);
    top: -180px; right: -100px;
  }
  .glow-2 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(82,130,255,0.05) 0%, transparent 65%);
    bottom: -120px; left: -80px;
  }

  .reg-card {
    width: 100%; max-width: 460px;
    z-index: 1;
    animation: fadeUp 0.4s ease both;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .brand {
    display: flex; align-items: center; gap: 10px; margin-bottom: 44px;
  }
  .brand-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #00c8aa, #5282ff);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center; font-size: 18px;
  }
  .brand-name {
    font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700;
    background: linear-gradient(90deg, #fff, #8090b0);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }

  .steps-bar { display: flex; gap: 8px; margin-bottom: 16px; }
  .seg {
    flex: 1; height: 3px; border-radius: 2px;
    background: rgba(255,255,255,0.07); transition: background 0.4s;
  }
  .seg.done   { background: #00c8aa; }
  .seg.active { background: rgba(0,200,170,0.35); }

  .step-meta {
    font-size: 12px; color: #4a5870;
    text-transform: uppercase; letter-spacing: 0.8px;
    margin-bottom: 14px;
  }
  .step-meta strong { color: #7090a0; }

  .form-title {
    font-family: 'Syne', sans-serif;
    font-size: 26px; font-weight: 700; letter-spacing: -0.7px;
    color: #e8ecf4; margin-bottom: 6px;
  }
  .form-sub { font-size: 13px; color: #4a5870; margin-bottom: 28px; }
  .form-sub a { color: #00c8aa; text-decoration: none; font-weight: 500; }
  .form-sub a:hover { text-decoration: underline; }

  .error-box {
    background: rgba(255,80,80,0.08); border: 1px solid rgba(255,80,80,0.2);
    border-radius: 10px; padding: 12px 16px;
    font-size: 13px; color: #ff7070; margin-bottom: 18px;
  }

  .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  .field { margin-bottom: 18px; }
  .field-lbl {
    display: block; font-size: 11px; font-weight: 500;
    text-transform: uppercase; letter-spacing: 0.8px;
    color: #4a5870; margin-bottom: 7px;
  }
  .pass-wrap { position: relative; }
  .field-inp {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; padding: 13px 16px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px; color: #e8ecf4; outline: none;
    transition: border-color 0.2s, background 0.2s;
  }
  .field-inp::placeholder { color: #2a3848; }
  .field-inp:focus {
    border-color: rgba(0,200,170,0.4);
    background: rgba(0,200,170,0.04);
  }
  .field-inp.err { border-color: rgba(255,80,80,0.4); }
  .field-err { display: block; font-size: 12px; color: #ff5050; margin-top: 5px; }

  .eye-btn {
    position: absolute; right: 12px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: #4a5870; font-size: 16px; padding: 4px;
    transition: color 0.2s;
  }
  .eye-btn:hover { color: #00c8aa; }

  .btn-row { display: flex; gap: 12px; margin-top: 8px; }
  .btn-back {
    padding: 14px 18px; flex-shrink: 0;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; font-family: 'DM Sans', sans-serif;
    font-size: 14px; color: #6080a0; cursor: pointer;
    transition: background 0.2s;
  }
  .btn-back:hover { background: rgba(255,255,255,0.09); }

  .btn-submit {
    flex: 1; padding: 14px;
    background: linear-gradient(135deg, #00c8aa, #00a88c);
    border: none; border-radius: 12px;
    font-family: 'Syne', sans-serif;
    font-size: 15px; font-weight: 600;
    color: #060a12; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .btn-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
  .btn-submit:disabled { opacity: 0.45; cursor: not-allowed; }

  .btn-spin {
    width: 14px; height: 14px;
    border: 2px solid rgba(0,0,0,0.25);
    border-top-color: #060a12;
    border-radius: 50%;
    animation: spin 0.6s linear infinite; flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 480px) {
    .row-2 { grid-template-columns: 1fr; }
    .reg-card { padding: 0 4px; }
  }
`
