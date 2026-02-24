// src/pages/AppointmentsPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { apiFetch } from '../api/auth'

const api = {
  get: (url) => apiFetch(url).then(r => r.json()),
  post: (url, body) => apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async r => {
    const d = await r.json()
    if (!r.ok) throw d
    return d
  }),
}

const MONTHS = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek']
const DAYS   = ['Yak','Du','Se','Ch','Pa','Ju','Sha']

const fDate = (s) => {
  const d = new Date(s)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${DAYS[d.getDay()]}`
}
const fTime = (t) => t ? String(t).slice(0,5) : '—'
const fCountdown = (tu) => {
  if (!tu) return null
  if (tu.days > 0)    return `${tu.days}k ${tu.hours}s`
  if (tu.hours > 0)   return `${tu.hours}s ${tu.minutes}d`
  if (tu.minutes > 0) return `${tu.minutes} daqiqa`
  return 'Hozir'
}

function GBtn({ children, onClick, disabled, red, full, sm }) {
  const ref = useRef(null)
  const c = red ? '#ef4444' : '#00c8aa'
  const move = e => {
    const r = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--gx', `${e.clientX - r.left}px`)
    ref.current.style.setProperty('--gy', `${e.clientY - r.top}px`)
    ref.current.style.setProperty('--go', '1')
  }
  const leave = () => ref.current?.style.setProperty('--go','0')
  return (
    <button ref={ref} disabled={disabled} onClick={onClick}
      onMouseMove={move} onMouseLeave={leave}
      style={{
        position:'relative', overflow:'hidden',
        width: full ? '100%' : 'auto',
        padding: sm ? '8px 16px' : '11px 26px',
        borderRadius: 10,
        border: `1px solid ${c}55`,
        background: `${c}0d`,
        color: c, fontFamily:'inherit',
        fontSize: sm ? 12 : 14, fontWeight:600,
        cursor: disabled ? 'not-allowed':'pointer',
        opacity: disabled ? .4 : 1,
        transition:'border-color .2s, transform .15s',
        letterSpacing: '.3px',
      }}>
      <span style={{
        position:'absolute', inset:0, pointerEvents:'none',
        background:`radial-gradient(160px circle at var(--gx,50%) var(--gy,50%), ${c}2a, transparent 70%)`,
        opacity:'var(--go,0)', transition:'opacity .3s',
      }}/>
      <span style={{position:'relative'}}>{children}</span>
    </button>
  )
}

function StepBar({ cur, labels }) {
  return (
    <div style={{display:'flex', alignItems:'center', gap:0, marginBottom:32}}>
      {labels.map((l,i) => (
        <div key={i} style={{display:'flex', alignItems:'center', flex: i<labels.length-1?1:'auto'}}>
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:4}}>
            <div style={{
              width:28, height:28, borderRadius:'50%',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11, fontWeight:700,
              background: i<cur ? '#00c8aa' : i===cur ? 'rgba(0,200,170,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${i<=cur ? '#00c8aa' : 'rgba(255,255,255,0.12)'}`,
              color: i<cur ? '#0a0f1a' : i===cur ? '#00c8aa' : '#4a5568',
              transition:'all .3s',
            }}>
              {i < cur ? '✓' : i+1}
            </div>
            <span style={{
              fontSize:10, fontWeight:600, letterSpacing:'.5px',
              color: i===cur ? '#00c8aa' : i<cur ? '#00c8aa99' : '#4a5568',
              textTransform:'uppercase',
            }}>{l}</span>
          </div>
          {i < labels.length-1 && (
            <div style={{
              flex:1, height:1, margin:'0 6px', marginBottom:16,
              background: i<cur
                ? 'linear-gradient(90deg,#00c8aa,#00c8aa88)'
                : 'rgba(255,255,255,0.07)',
              transition:'background .4s',
            }}/>
          )}
        </div>
      ))}
    </div>
  )
}

function Skel({ h=60, r=12, mb=10 }) {
  return <div style={{
    height:h, borderRadius:r, marginBottom:mb,
    background:'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)',
    backgroundSize:'200% 100%',
    animation:'shimmer 1.5s infinite',
  }}/>
}

function AptCard({ a, onCancel }) {
  const statusCfg = {
    BOOKED:   { label:'Kutilmoqda',   color:'#f59e0b' },
    PENDING:  { label:'Kutilmoqda',   color:'#f59e0b' },
    CANCELED: { label:'Bekor qilindi', color:'#ef4444' },
    CANCELLED:{ label:'Bekor qilindi', color:'#ef4444' },
  }
  const st = statusCfg[a.status] || statusCfg.BOOKED
  const canCancel = (a.status==='BOOKED'||a.status==='PENDING') && !a.is_past
  const countdown = fCountdown(a.time_until)

  return (
    <div style={{
      background:'rgba(255,255,255,0.03)',
      border:'1px solid rgba(255,255,255,0.08)',
      borderRadius:16, overflow:'hidden',
      transition:'border-color .2s, transform .2s',
      position:'relative',
    }}
    onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(0,200,170,0.25)'; e.currentTarget.style.transform='translateY(-2px)'}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.transform='none'}}
    >
      <div style={{height:2, background:`linear-gradient(90deg,${st.color},transparent)`}}/>
      <div style={{padding:'18px 20px'}}>
        <div style={{display:'flex', alignItems:'flex-start', gap:14, marginBottom:14}}>
          <div style={{
            width:44, height:44, borderRadius:12, flexShrink:0,
            background:`${st.color}1a`, border:`1px solid ${st.color}44`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:16, fontWeight:700, color:st.color,
          }}>
            {(a.doctor_name||'D')[0].toUpperCase()}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:15, fontWeight:700, color:'#e8eaf0', marginBottom:2}}>
              {a.doctor_name || '—'}
            </div>
            <div style={{fontSize:12, color:'#6b7a99', marginBottom:2}}>
              {a.department_name || a.specialty || '—'}
            </div>
            {a.doctor_room && (
              <div style={{fontSize:11, color:'#4a5568'}}>
                🚪 {a.doctor_room}-xona
              </div>
            )}
          </div>
          <div style={{
            fontSize:11, fontWeight:700, padding:'4px 10px',
            borderRadius:20, border:`1px solid ${st.color}44`,
            background:`${st.color}15`, color:st.color,
            letterSpacing:'.4px', flexShrink:0,
          }}>
            {st.label}
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10}}>
          <div style={{padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)'}}>
            <div style={{fontSize:10, color:'#4a5568', marginBottom:3, letterSpacing:'.5px', textTransform:'uppercase'}}>Sana</div>
            <div style={{fontSize:13, fontWeight:600, color:'#c8d0e0'}}>{fDate(a.appointment_date)}</div>
          </div>
          <div style={{padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)'}}>
            <div style={{fontSize:10, color:'#4a5568', marginBottom:3, letterSpacing:'.5px', textTransform:'uppercase'}}>Vaqt</div>
            <div style={{fontSize:13, fontWeight:600, color:'#c8d0e0'}}>
              {fTime(a.appointment_time)}
              {a.end_time && <span style={{color:'#4a5568'}}> – {fTime(a.end_time)}</span>}
            </div>
          </div>
        </div>

        {countdown && !a.is_past && (
          <div style={{
            padding:'8px 12px', borderRadius:8, marginBottom:10,
            background:'rgba(0,200,170,0.06)', border:'1px solid rgba(0,200,170,0.15)',
            display:'flex', alignItems:'center', gap:8,
            fontSize:12, color:'#00c8aa', fontWeight:600,
          }}>
            <span>⏳</span><span>{countdown} qoldi</span>
          </div>
        )}

        {a.is_past && (a.status==='BOOKED'||a.status==='PENDING') && (
          <div style={{
            padding:'8px 12px', borderRadius:8, marginBottom:10,
            background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)',
            fontSize:12, color:'#ef4444',
          }}>Vaqt o'tib ketdi</div>
        )}

        {a.queue_number && (
          <div style={{fontSize:12, color:'#4a5568', marginBottom:10}}>
            Navbat raqami: <b style={{color:'#6b7a99'}}>#{a.queue_number}</b>
          </div>
        )}

        {canCancel && (
          <GBtn red full sm onClick={() => onCancel(a.id)}>
            Navbatni bekor qilish
          </GBtn>
        )}
      </div>
    </div>
  )
}

function BookingFlow({ onDone, onBack }) {
  const STEP_LABELS = ['Soha', 'Shifokor', 'Kun', 'Vaqt', 'Tasdiqlash']
  const [step, setStep]         = useState(0)
  const [specialties, setSpec]  = useState([])
  const [doctors, setDoctors]   = useState([])
  const [schedule, setSchedule] = useState([])
  const [slots, setSlots]       = useState([])
  const [sel, setSel]           = useState({ specialty:null, doctor:null, day:null, slot:null })
  const [loading, setLoading]   = useState(false)
  const [submitting, setSubmit] = useState(false)
  const [err, setErr]           = useState(null)
  const [success, setSuccess]   = useState(null)
  const [slotsRefreshKey, setSlotsRefreshKey] = useState(0)


  const go = (n) => {
      setErr(null)
      if (n === 3) setSlotsRefreshKey(k => k + 1)
      setStep(n)
  }

  useEffect(() => {
    setLoading(true)
    api.get('/api/navbat/specialties/')
      .then(d => setSpec(Array.isArray(d) ? d : d.results || []))
      .catch(() => setErr('Sohalar yuklanmadi'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (step !== 1 || !sel.specialty) return
    setLoading(true)
    api.get(`/api/navbat/doctors/?specialty_id=${sel.specialty.id}`)
      .then(d => setDoctors(Array.isArray(d) ? d : d.results || []))
      .catch(() => setErr('Shifokorlar yuklanmadi'))
      .finally(() => setLoading(false))
  }, [step, sel.specialty])

  useEffect(() => {
    if (step !== 2 || !sel.doctor) return
    setLoading(true)
    const today = new Date().toISOString().slice(0,10)
    api.get(`/api/appointments/week-schedule/?doctor=${sel.doctor.id}&start_date=${today}`)
      .then(d => setSchedule(d.schedule || []))
      .catch(() => setErr('Jadval yuklanmadi'))
      .finally(() => setLoading(false))
  }, [step, sel.doctor])

  useEffect(() => {
    if (step !== 3 || !sel.doctor || !sel.day) return
    setLoading(true)
    api.get(`/api/appointments/available-slots/?doctor=${sel.doctor.id}&date=${sel.day.date}`)
      .then(d => setSlots(d.slots || []))
      .catch(() => setErr('Vaqtlar yuklanmadi'))
      .finally(() => setLoading(false))
  }, [step, sel.doctor, sel.day, slotsRefreshKey])

  const submit = async () => {
    if (!sel.slot) return
    setSubmit(true); setErr(null)
    try {
      const res = await api.post('/api/appointments/create/', {
        doctor: sel.doctor.id,
        appointment_date: sel.day.date,
        appointment_time: sel.slot.time_obj || sel.slot.time,
      })
      setSuccess(res)
    } catch(e) {
      setErr(e?.appointment_time?.[0] || e?.detail || e?.error || 'Xatolik yuz berdi')
    } finally {
      setSubmit(false)
    }
  }

  if (success) return (
    <div style={{textAlign:'center', padding:'40px 20px'}}>
      <div style={{
        width:72, height:72, borderRadius:'50%', margin:'0 auto 20px',
        background:'rgba(0,200,170,0.12)', border:'2px solid rgba(0,200,170,0.4)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:28, animation:'popIn .4s cubic-bezier(0.34,1.56,0.64,1)',
      }}>✓</div>
      <h3 style={{fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color:'#e8eaf0', marginBottom:8}}>
        Navbat rasmiylashtirildi!
      </h3>
      <p style={{color:'#6b7a99', fontSize:14, marginBottom:24}}>
        {success.doctor_name} — {fDate(success.appointment_date)}, {fTime(success.appointment_time)}
      </p>
      <div style={{padding:16, borderRadius:12, marginBottom:24, background:'rgba(0,200,170,0.06)', border:'1px solid rgba(0,200,170,0.2)', textAlign:'left'}}>
        {[
          ['Shifokor', success.doctor_name],
          ['Sana', fDate(success.appointment_date)],
          ['Vaqt', `${fTime(success.appointment_time)}${success.end_time ? ' – '+fTime(success.end_time) : ''}`],
          ['Holat', 'Kutilmoqda'],
        ].map(([k,v]) => (
          <div key={k} style={{display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
            <span style={{fontSize:12, color:'#4a5568'}}>{k}</span>
            <span style={{fontSize:13, color:'#c8d0e0', fontWeight:600}}>{v}</span>
          </div>
        ))}
      </div>
      <GBtn onClick={onDone} full>Navbatlarimga qaytish</GBtn>
    </div>
  )

  const Step0 = (
    <div>
      <h3 style={sectionTitle}>Soha tanlang</h3>
      {loading ? [1,2,3].map(i=><Skel key={i}/>) :
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          {specialties.map(sp => (
            <button key={sp.id}
              onClick={() => { setSel(s=>({...s,specialty:sp})); go(1) }}
              style={{
                padding:'16px 14px', borderRadius:12, textAlign:'left',
                background: sel.specialty?.id===sp.id ? 'rgba(0,200,170,0.12)' : 'rgba(255,255,255,0.03)',
                border:`1px solid ${sel.specialty?.id===sp.id ? 'rgba(0,200,170,0.4)' : 'rgba(255,255,255,0.07)'}`,
                color:'#c8d0e0', fontFamily:'inherit', cursor:'pointer', transition:'all .2s',
              }}
              onMouseEnter={e=>{if(sel.specialty?.id!==sp.id){e.currentTarget.style.borderColor='rgba(0,200,170,0.2)'; e.currentTarget.style.background='rgba(255,255,255,0.05)'}}}
              onMouseLeave={e=>{if(sel.specialty?.id!==sp.id){e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.background='rgba(255,255,255,0.03)'}}}
            >
              <div style={{fontSize:13, fontWeight:600}}>{sp.name}</div>
            </button>
          ))}
        </div>
      }
    </div>
  )

  const Step1 = (
    <div>
      <button onClick={()=>go(0)} style={backBtn}>← Soha</button>
      <h3 style={sectionTitle}>{sel.specialty?.name} — Shifokor tanlang</h3>
      {loading ? [1,2,3].map(i=><Skel key={i} h={72}/>) :
        doctors.length === 0
          ? <div style={emptyBox}>Bu sohada shifokor yo'q</div>
          : doctors.map(doc => (
            <button key={doc.id}
              onClick={()=>{ setSel(s=>({...s,doctor:doc})); go(2) }}
              style={{
                display:'flex', alignItems:'center', gap:14,
                width:'100%', textAlign:'left',
                padding:'14px 16px', borderRadius:12, marginBottom:8,
                background: sel.doctor?.id===doc.id ? 'rgba(0,200,170,0.1)' : 'rgba(255,255,255,0.03)',
                border:`1px solid ${sel.doctor?.id===doc.id ? 'rgba(0,200,170,0.35)':'rgba(255,255,255,0.07)'}`,
                cursor:'pointer', fontFamily:'inherit', transition:'all .2s',
              }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(0,200,170,0.2)'}}
              onMouseLeave={e=>{if(sel.doctor?.id!==doc.id)e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}}
            >
              <div style={{
                width:40, height:40, borderRadius:10, flexShrink:0,
                background:'rgba(0,200,170,0.12)', border:'1px solid rgba(0,200,170,0.25)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:15, fontWeight:700, color:'#00c8aa',
              }}>
                {(doc.full_name||doc.name||'D')[0]}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14, fontWeight:600, color:'#e8eaf0'}}>{doc.full_name || doc.name}</div>
                <div style={{fontSize:11, color:'#4a5568', marginTop:2}}>
                  {doc.room_number ? `${doc.room_number}-xona` : ''}
                  {doc.address ? ` · ${doc.address}` : ''}
                </div>
              </div>
              <span style={{color:'rgba(0,200,170,0.4)', fontSize:16}}>›</span>
            </button>
          ))
      }
    </div>
  )

  const Step2 = (
    <div>
      <button onClick={()=>go(1)} style={backBtn}>← Shifokor</button>
      <h3 style={sectionTitle}>Kun tanlang</h3>
      {loading ? [1,2,3,4,5,6,7].map(i=><Skel key={i} h={56}/>) :
        <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6}}>
          {schedule.map((day, i) => {
            const dt = new Date(day.date)
            const isSel = sel.day?.date === day.date
            const full = day.is_full || day.available_slots === 0
            return (
              <button key={i} disabled={full}
                onClick={()=>{ setSel(s=>({...s,day})); go(3) }}
                style={{
                  padding:'10px 4px', borderRadius:10, textAlign:'center',
                  background: isSel ? 'rgba(0,200,170,0.15)' : full ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                  border:`1px solid ${isSel ? 'rgba(0,200,170,0.5)' : full ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'}`,
                  cursor: full ? 'not-allowed' : 'pointer', opacity: full ? .4 : 1,
                  fontFamily:'inherit', transition:'all .2s',
                }}
                onMouseEnter={e=>{ if(!full&&!isSel) e.currentTarget.style.borderColor='rgba(0,200,170,0.3)' }}
                onMouseLeave={e=>{ if(!full&&!isSel) e.currentTarget.style.borderColor='rgba(255,255,255,0.08)' }}
              >
                <div style={{fontSize:9, color:'#4a5568', letterSpacing:'.5px', textTransform:'uppercase', marginBottom:4}}>{DAYS[dt.getDay()]}</div>
                <div style={{fontSize:16, fontWeight:700, color: isSel ? '#00c8aa' : full ? '#333' : '#c8d0e0'}}>{dt.getDate()}</div>
                <div style={{fontSize:9, color: isSel ? '#00c8aa88' : '#4a5568', marginTop:3}}>{day.available_slots}</div>
              </button>
            )
          })}
        </div>
      }
    </div>
  )

  const Step3 = (
    <div>
      <button onClick={()=>go(2)} style={backBtn}>← Kun</button>
      <h3 style={sectionTitle}>{sel.day && fDate(sel.day.date)} — Vaqt tanlang</h3>
      {loading ? (
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8}}>
          {[...Array(12)].map((_,i)=><Skel key={i} h={44}/>)}
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8}}>
          {slots.map((sl, i) => {
            const isSel = sel.slot?.time === sl.time
            const avail = sl.is_available
            return (
              <button key={i} disabled={!avail}
                onClick={()=>{ setSel(s=>({...s,slot:sl})); go(4) }}
                style={{
                  padding:'10px 6px', borderRadius:10, textAlign:'center',
                  background: isSel ? 'rgba(0,200,170,0.15)' : !avail ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                  border:`1px solid ${isSel ? 'rgba(0,200,170,0.5)' : !avail ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'}`,
                  cursor: !avail ? 'not-allowed':'pointer', opacity: !avail ? .35 : 1,
                  fontFamily:'inherit', transition:'all .2s', position:'relative', overflow:'hidden',
                }}
                onMouseEnter={e=>{ if(avail&&!isSel) e.currentTarget.style.borderColor='rgba(0,200,170,0.3)' }}
                onMouseLeave={e=>{ if(avail&&!isSel) e.currentTarget.style.borderColor='rgba(255,255,255,0.08)' }}
              >
                <div style={{fontSize:13, fontWeight:700, color: isSel ? '#00c8aa' : !avail ? '#333' : '#c8d0e0'}}>{sl.time}</div>
                {!avail && (
                  <div style={{
                    position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:8, color:'#ef444466', letterSpacing:'.5px', textTransform:'uppercase',
                  }}>band</div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  const Step4 = (
    <div>
      <button onClick={()=>go(3)} style={backBtn}>← Vaqt</button>
      <h3 style={sectionTitle}>Navbatni tasdiqlang</h3>
      <div style={{borderRadius:14, overflow:'hidden', border:'1px solid rgba(0,200,170,0.2)', marginBottom:20}}>
        {[
          ['Soha',     sel.specialty?.name],
          ['Shifokor', sel.doctor?.full_name || sel.doctor?.name],
          ['Xona',     sel.doctor?.room_number || '—'],
          ['Manzil',   sel.doctor?.address || '—'],
          ['Sana',     sel.day && fDate(sel.day.date)],
          ['Vaqt',     sel.slot && `${sel.slot.time} – ${sel.slot.end_time}`],
        ].map(([k,v],i) => (
          <div key={k} style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'13px 18px',
            background: i%2===0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)',
            borderBottom: i<5 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}>
            <span style={{fontSize:12, color:'#4a5568', letterSpacing:'.4px'}}>{k}</span>
            <span style={{fontSize:13, color:'#c8d0e0', fontWeight:600}}>{v || '—'}</span>
          </div>
        ))}
      </div>
      {err && (
        <div style={{
          padding:'10px 14px', borderRadius:10, marginBottom:16,
          background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)',
          fontSize:13, color:'#ef4444',
        }}>{err}</div>
      )}
      <GBtn onClick={submit} disabled={submitting} full>
        {submitting ? 'Yuklanmoqda...' : 'Navbatni rasmiylashtirish →'}
      </GBtn>
    </div>
  )

  const PANELS = [Step0, Step1, Step2, Step3, Step4]

  return (
    <div>
      <StepBar cur={step} labels={STEP_LABELS} />
      {PANELS[step]}
    </div>
  )
}

const sectionTitle = {
  fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700,
  color:'#e8eaf0', marginBottom:16, marginTop:0,
}
const backBtn = {
  background:'none', border:'none', color:'#4a5568',
  fontFamily:'inherit', fontSize:12, cursor:'pointer',
  padding:'0 0 14px 0', display:'block', transition:'color .2s',
}
const emptyBox = {
  textAlign:'center', padding:'32px 16px',
  color:'#4a5568', fontSize:13,
  background:'rgba(255,255,255,0.02)',
  border:'1px dashed rgba(255,255,255,0.06)',
  borderRadius:12,
}

// ═══════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════
export default function AppointmentsPage() {
  const [view, setView]         = useState('list')
  const [appointments, setApts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('all')   // ← 'all' | 'active'
  const [cancelling, setCancel] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/api/appointments/my/')
      .then(d => setApts(Array.isArray(d) ? d : []))
      .catch(() => setApts([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleCancel = async (id) => {
    if (!window.confirm('Navbatni bekor qilmoqchimisiz?')) return
    setCancel(id)
    try {
      await api.post(`/api/appointments/${id}/cancel/`, {})
      load()
    } catch {
      alert("Bekor qilishda xatolik")
    } finally {
      setCancel(null)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn  { from{transform:scale(.6);opacity:0} to{transform:scale(1);opacity:1} }
        .page { animation: fadeUp .35s ease both }
      `}</style>

      <div className="page" style={{
        minHeight:'100vh', background:'var(--bg,#080d1a)',
        padding:'28px 20px 60px',
        maxWidth:720, margin:'0 auto',
        fontFamily:'DM Sans, sans-serif',
      }}>

        {view === 'list' ? (
          <>
            {/* Header */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28}}>
              <div>
                <h1 style={{
                  fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:800,
                  color:'#e8eaf0', margin:0, lineHeight:1.2,
                }}>Navbatlarim</h1>
                <p style={{color:'#4a5568', fontSize:13, margin:'6px 0 0'}}>
                  {tab === 'active'
                    ? `${appointments.filter(a=>a.status==='BOOKED'||a.status==='PENDING').length} ta faol navbat`
                    : `${appointments.length} ta jami navbat`}
                </p>
              </div>
              <GBtn onClick={() => setView('book')}>+ Navbat olish</GBtn>
            </div>

            {/* TABS */}
            <div style={{
              display:'flex', gap:6, marginBottom:20,
              background:'rgba(255,255,255,0.03)',
              border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:12, padding:4,
            }}>
              {[
                { key:'all',    label:'📋 Jami', count: appointments.length },
                { key:'active', label:'✅ Faol', count: appointments.filter(a=>a.status==='BOOKED'||a.status==='PENDING').length },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  flex:1, padding:'9px 12px', borderRadius:9,
                  border: tab===t.key ? '1px solid rgba(0,200,170,0.3)' : '1px solid transparent',
                  background: tab===t.key ? 'rgba(0,200,170,0.1)' : 'transparent',
                  color: tab===t.key ? '#00c8aa' : '#6b7a99',
                  fontFamily:'inherit', fontSize:13, fontWeight:600,
                  cursor:'pointer', transition:'all .2s',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                }}>
                  {t.label}
                  <span style={{
                    fontSize:10, padding:'1px 6px', borderRadius:8,
                    background: tab===t.key ? 'rgba(0,200,170,0.2)' : 'rgba(255,255,255,0.06)',
                    color: tab===t.key ? '#00c8aa' : '#4a5568',
                  }}>{t.count}</span>
                </button>
              ))}
            </div>

            {/* LIST */}
            {loading ? (
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                {[1,2,3].map(i => <Skel key={i} h={140} r={16}/>)}
              </div>
            ) : (() => {
              const filtered = tab === 'active'
                ? appointments.filter(a => a.status==='BOOKED' || a.status==='PENDING')
                : [
                    ...appointments.filter(a => a.status==='CANCELLED' || a.status==='CANCELED'),
                    ...appointments.filter(a => a.status!=='CANCELLED' && a.status!=='CANCELED'),
                  ]

              if (filtered.length === 0) return (
                <div style={{
                  textAlign:'center', padding:'60px 20px',
                  background:'rgba(255,255,255,0.02)',
                  border:'1px dashed rgba(255,255,255,0.06)',
                  borderRadius:16,
                }}>
                  <div style={{fontSize:40, marginBottom:12}}>📭</div>
                  <div style={{fontSize:15, color:'#6b7a99', marginBottom:20}}>
                    {tab === 'active' ? "Faol navbat yo'q" : "Hozircha navbat yo'q"}
                  </div>
                  <GBtn onClick={() => setView('book')}>Navbat olish →</GBtn>
                </div>
              )

              return (
                <div style={{display:'flex', flexDirection:'column', gap:12}}>
                  {filtered.map(a => (
                    <AptCard key={a.id} a={a} onCancel={handleCancel} />
                  ))}
                </div>
              )
            })()}
          </>
        ) : (
          <>
            <div style={{marginBottom:28}}>
              <button
                onClick={() => setView('list')}
                style={{
                  background:'none', border:'none', color:'#4a5568',
                  fontFamily:'inherit', fontSize:13, cursor:'pointer',
                  padding:0, marginBottom:12, display:'flex', alignItems:'center', gap:6,
                }}
                onMouseEnter={e=>e.currentTarget.style.color='#6b7a99'}
                onMouseLeave={e=>e.currentTarget.style.color='#4a5568'}
              >
                ← Navbatlarimga qaytish
              </button>
              <h1 style={{
                fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:800,
                color:'#e8eaf0', margin:0,
              }}>Navbat olish</h1>
            </div>

            <div style={{
              background:'rgba(255,255,255,0.02)',
              border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:20, padding:24,
            }}>
              <BookingFlow
                onDone={() => { setView('list'); load() }}
                onBack={() => setView('list')}
              />
            </div>
          </>
        )}
      </div>
    </>
  )
}