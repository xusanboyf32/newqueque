import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { departmentsAPI } from '../api/departments'
import { appointmentsAPI } from '../api/appointments'

// ── Star rating ──────────────────────────────────────────────────
function Stars({ rating }) {
  const r = parseFloat(rating) || 0
  return (
    <span className="stars-wrap" title={`${r}/5`}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(r) ? '#f59e0b' : 'var(--border)', fontSize: 12 }}>★</span>
      ))}
      <span className="rating-num">{r.toFixed(1)}</span>
    </span>
  )
}

// ── Doctor card ──────────────────────────────────────────────────
function DoctorCard({ doc, onBook }) {
  const initials = (doc.full_name || '').split(' ').map(n => n[0]).join('').slice(0, 2)

  return (
    <div className={`doc-card${!doc.is_available_today ? ' unavailable' : ''}`}>
      {/* Availability badge */}
      <div className={`avail-badge${doc.is_available_today ? ' on' : ' off'}`}>
        <span className="avail-dot" />
        {doc.is_available_today ? 'Bugun mavjud' : 'Bugun yoq'}
      </div>

      {/* Photo / initials */}
      <div className="doc-photo-wrap">
        {doc.photo
          ? <img src={doc.photo} alt={doc.full_name} className="doc-photo" />
          : <div className="doc-initials">{initials}</div>
        }
      </div>

      {/* Info */}
      <div className="doc-info">
        <div className="doc-name">Dr. {doc.full_name}</div>
        <div className="doc-spec">{doc.specialization}</div>
        <div className="doc-dept">{doc.department_name}</div>

        <Stars rating={doc.rating} />

        <div className="doc-meta-row">
          <span className="doc-meta-item">🏢 Xona {doc.room_number}</span>
          <span className="doc-meta-item">⏱ {doc.years_of_experience} yil</span>
          <span className="doc-meta-item">⏰ {doc.working_hours_display}</span>
        </div>

        {doc.consultation_fee > 0 && (
          <div className="doc-fee">
            💰 {Number(doc.consultation_fee).toLocaleString()} so'm
          </div>
        )}
      </div>

      {/* Action */}
      <button
        className={`doc-book-btn${!doc.is_available_today ? ' disabled' : ''}`}
        onClick={() => doc.is_available_today && onBook(doc)}
        disabled={!doc.is_available_today}
      >
        {doc.is_available_today ? '📅 Navbat olish' : 'Bugun band'}
      </button>
    </div>
  )
}

// ── Department chip ──────────────────────────────────────────────
function DeptChip({ dept, active, onClick }) {
  return (
    <button
      className={`dept-chip${active ? ' active' : ''}`}
      onClick={onClick}
      style={active ? { borderColor: dept.color, color: dept.color, background: dept.color + '18' } : {}}
    >
      {dept.icon && <span>{dept.icon}</span>}
      {dept.name_uz}
      {dept.active_doctors_count > 0 && (
        <span className="dept-count">{dept.active_doctors_count}</span>
      )}
    </button>
  )
}

// ── Book Modal ───────────────────────────────────────────────────
function BookModal({ doctor, onClose, onSuccess }) {
  const [slots, setSlots]     = useState([])
  const [selDate, setSelDate] = useState(() => new Date().toISOString().split('T')[0])
  const [selTime, setSelTime] = useState('')
  const [complaint, setComplaint] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError] = useState('')

  // Dates (bugundan 14 kun)
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    if (!selDate || !doctor) return
    setLoadingSlots(true); setSelTime(''); setSlots([])
    appointmentsAPI.getAvailableSlots(doctor.id, selDate)
      .then(data => setSlots(data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [selDate, doctor])

  const handleBook = async () => {
    if (!selTime) { setError('Vaqtni tanlang'); return }
    setSubmitting(true); setError('')
    try {
      await appointmentsAPI.create({
        doctor: doctor.id,
        appointment_date: selDate,
        appointment_time: selTime,
        complaint,
      })
      onSuccess()
    } catch (err) {
      const msg = Object.values(err || {})[0]
      setError(Array.isArray(msg) ? msg[0] : msg || 'Xatolik yuz berdi')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDateLabel = (d) => new Date(d).toLocaleDateString('uz-UZ', {
    weekday: 'short', day: 'numeric', month: 'short'
  })

  return (
    <>
      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
          display: flex; align-items: flex-end;
          animation: fadeIn 0.2s ease;
        }
        @media (min-width: 600px) {
          .modal-overlay { align-items: center; justify-content: center; }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .modal-sheet {
          background: var(--surface);
          border-radius: 24px 24px 0 0;
          width: 100%; max-height: 92vh;
          overflow-y: auto; padding: 0 0 32px;
          animation: slideUp 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        @media (min-width: 600px) {
          .modal-sheet {
            border-radius: 20px; max-width: 520px;
            max-height: 85vh;
          }
        }
        @keyframes slideUp { from { transform: translateY(40px); opacity:0; } to { transform: translateY(0); opacity:1; } }

        .modal-handle {
          width: 36px; height: 4px; border-radius: 2px;
          background: var(--border); margin: 12px auto 0;
        }
        .modal-header {
          padding: 20px 20px 0;
          display: flex; align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border); padding-bottom: 16px;
        }
        .modal-doc-info { display: flex; align-items: center; gap: 12px; }
        .modal-doc-avatar {
          width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
          background: linear-gradient(135deg, rgba(82,130,255,0.2), rgba(0,200,170,0.2));
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700;
          color: var(--accent);
        }
        .modal-doc-name { font-size: 15px; font-weight: 700; color: var(--text-primary); }
        .modal-doc-spec { font-size: 12px; color: var(--text-muted); }
        .modal-close {
          width: 32px; height: 32px; border-radius: 10px;
          background: var(--hover); border: none; cursor: pointer;
          color: var(--text-muted); font-size: 18px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .modal-close:hover { background: var(--border); }

        .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 20px; }

        .modal-label {
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.8px; color: var(--text-muted); margin-bottom: 10px;
        }

        /* Date selector */
        .date-scroll {
          display: flex; gap: 8px; overflow-x: auto;
          padding-bottom: 4px; scrollbar-width: none;
        }
        .date-scroll::-webkit-scrollbar { display: none; }
        .date-chip {
          flex-shrink: 0; padding: 8px 12px; border-radius: 12px;
          border: 1px solid var(--border); background: none;
          cursor: pointer; text-align: center;
          transition: all 0.15s; font-family: 'DM Sans', sans-serif;
        }
        .date-chip.active {
          background: var(--accent-dim); border-color: var(--accent-border);
        }
        .date-chip-day { font-size: 10px; color: var(--text-muted); text-transform: uppercase; }
        .date-chip-num { font-size: 18px; font-weight: 700; font-family: 'Syne', sans-serif; color: var(--text-primary); }
        .date-chip.active .date-chip-num { color: var(--accent); }
        .date-chip-month { font-size: 10px; color: var(--text-muted); }

        /* Time slots */
        .slots-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
        }
        .slot-btn {
          padding: 9px 4px; border-radius: 10px; text-align: center;
          border: 1px solid var(--border); background: none; cursor: pointer;
          font-size: 13px; font-weight: 500; color: var(--text-secondary);
          font-family: 'DM Sans', sans-serif; transition: all 0.15s;
        }
        .slot-btn:hover:not(.taken) { border-color: var(--accent-border); color: var(--accent); }
        .slot-btn.selected { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); font-weight: 600; }
        .slot-btn.taken { background: var(--hover); color: var(--text-muted); cursor: not-allowed; text-decoration: line-through; opacity: 0.5; }

        /* Complaint */
        .complaint-input {
          width: 100%; background: var(--hover);
          border: 1px solid var(--border); border-radius: 12px;
          padding: 12px 14px; font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: var(--text-primary); outline: none;
          resize: none; transition: border-color 0.2s;
          min-height: 80px;
        }
        .complaint-input::placeholder { color: var(--text-muted); }
        .complaint-input:focus { border-color: var(--accent-border); }

        .modal-error {
          background: var(--danger-dim); border: 1px solid rgba(255,80,80,0.2);
          border-radius: 10px; padding: 10px 14px;
          font-size: 13px; color: var(--danger);
        }

        .modal-submit {
          width: 100%; padding: 15px;
          background: linear-gradient(135deg, #00c8aa, #00a88c);
          border: none; border-radius: 14px;
          font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
          color: #060a12; cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .modal-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .modal-submit:disabled { opacity: 0.45; cursor: not-allowed; }
        .spin {
          width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #060a12; border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .no-slots { text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px; }
      `}</style>

      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal-sheet">
          <div className="modal-handle" />

          {/* Header */}
          <div className="modal-header">
            <div className="modal-doc-info">
              <div className="modal-doc-avatar">
                {(doctor.full_name || '').split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div className="modal-doc-name">Dr. {doctor.full_name}</div>
                <div className="modal-doc-spec">{doctor.specialization} • Xona {doctor.room_number}</div>
              </div>
            </div>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>

          <div className="modal-body">
            {/* Date */}
            <div>
              <div className="modal-label">📅 Sanani tanlang</div>
              <div className="date-scroll">
                {dates.map(d => {
                  const dt = new Date(d)
                  const active = selDate === d
                  return (
                    <button
                      key={d}
                      className={`date-chip${active ? ' active' : ''}`}
                      onClick={() => setSelDate(d)}
                    >
                      <div className="date-chip-day">
                        {dt.toLocaleDateString('uz-UZ', { weekday: 'short' })}
                      </div>
                      <div className="date-chip-num">{dt.getDate()}</div>
                      <div className="date-chip-month">
                        {dt.toLocaleDateString('uz-UZ', { month: 'short' })}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time slots */}
            <div>
              <div className="modal-label">⏰ Vaqtni tanlang</div>
              {loadingSlots ? (
                <div className="slots-grid">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="slot-btn"
                      style={{ background: 'var(--hover)', border: 'none', animation: 'shimmer 1.4s infinite',
                        backgroundImage: 'linear-gradient(90deg, var(--hover) 25%, var(--border) 50%, var(--hover) 75%)',
                        backgroundSize: '200% 100%' }} />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <div className="no-slots">Bu kunda bo'sh vaqt yo'q 😔</div>
              ) : (
                <div className="slots-grid">
                  {slots.map(s => (
                    <button
                      key={s.time}
                      className={`slot-btn${!s.is_available ? ' taken' : selTime === s.time_obj ? ' selected' : ''}`}
                      onClick={() => s.is_available && setSelTime(s.time_obj)}
                      disabled={!s.is_available}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Complaint */}
            <div>
              <div className="modal-label">💬 Shikoyat (ixtiyoriy)</div>
              <textarea
                className="complaint-input"
                placeholder="Nima uchun kelmoqchisiz? (ixtiyoriy)"
                value={complaint}
                onChange={e => setComplaint(e.target.value)}
                maxLength={500}
              />
            </div>

            {error && <div className="modal-error">⚠ {error}</div>}

            <button
              className="modal-submit"
              onClick={handleBook}
              disabled={submitting || !selTime}
            >
              {submitting ? <><div className="spin" /> Saqlanmoqda...</> : '📅 Navbatni tasdiqlash'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Success toast ────────────────────────────────────────────────
function SuccessToast({ onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [])
  return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #00c8aa, #00a88c)',
      color: '#060a12', padding: '12px 24px', borderRadius: 14,
      fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14,
      zIndex: 300, boxShadow: '0 8px 24px rgba(0,200,170,0.35)',
      animation: 'slideUp 0.3s ease',
      whiteSpace: 'nowrap',
    }}>
      ✅ Navbat muvaffaqiyatli olindi!
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────
export default function DepartmentsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [departments, setDepartments] = useState([])
  const [doctors,     setDoctors]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [searchQ,     setSearchQ]     = useState('')
  const [searching,   setSearching]   = useState(false)
  const [searchRes,   setSearchRes]   = useState(null)
  const [activeDept,  setActiveDept]  = useState(null) // null = barchasi
  const [sortBy,      setSortBy]      = useState('-rating')
  const [bookDoc,     setBookDoc]     = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [view,        setView]        = useState('doctors') // 'departments' | 'doctors'

  // Initial load
  useEffect(() => {
    Promise.all([
      departmentsAPI.getDepartments(),
      departmentsAPI.getDoctors({ sort: sortBy }),
    ]).then(([depts, docs]) => {
      setDepartments(Array.isArray(depts) ? depts : depts?.results || [])
      setDoctors(Array.isArray(docs) ? docs : docs?.results || [])
    }).finally(() => setLoading(false))
  }, [])

  // Filter by department
  useEffect(() => {
    if (searchRes) return
    const params = { sort: sortBy }
    if (activeDept) params.department = activeDept
    departmentsAPI.getDoctors(params)
      .then(data => setDoctors(Array.isArray(data) ? data : data?.results || []))
      .catch(() => {})
  }, [activeDept, sortBy])

  // Search
  useEffect(() => {
    if (!searchQ.trim() || searchQ.length < 2) { setSearchRes(null); return }
    const t = setTimeout(() => {
      setSearching(true)
      departmentsAPI.search(searchQ)
        .then(setSearchRes)
        .catch(() => setSearchRes(null))
        .finally(() => setSearching(false))
    }, 400)
    return () => clearTimeout(t)
  }, [searchQ])

  const displayedDoctors = searchRes ? searchRes.doctors : doctors
  const displayedDepts   = searchRes ? searchRes.departments : departments

  if (loading) return <DeptSkeleton />

  return (
    <>
      <style>{CSS}</style>

      <div className="dept-root">

        {/* ── Header ── */}
        <div className="dept-header">
          <h1 className="dept-title">Bo'limlar & Doktorlar</h1>
          <p className="dept-sub">
            {departments.length} ta bo'lim • {doctors.length} ta shifokor
          </p>
        </div>

        {/* ── Search ── */}
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Doktor yoki bo'lim qidiring..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
          {searchQ && (
            <button className="search-clear" onClick={() => { setSearchQ(''); setSearchRes(null) }}>✕</button>
          )}
          {searching && <div className="search-spin" />}
        </div>

        {/* ── View toggle ── */}
        {!searchRes && (
          <div className="view-toggle">
            <button className={`vt-btn${view === 'departments' ? ' active' : ''}`} onClick={() => setView('departments')}>
              🏥 Bo'limlar
            </button>
            <button className={`vt-btn${view === 'doctors' ? ' active' : ''}`} onClick={() => setView('doctors')}>
              👨‍⚕️ Doktorlar
            </button>
          </div>
        )}

        {/* ── Search results ── */}
        {searchRes && (
          <div className="search-results-label">
            🔍 "{searchQ}" uchun {searchRes.total_results} ta natija
          </div>
        )}

        {/* ── DEPARTMENTS VIEW ── */}
        {(view === 'departments' || searchRes) && displayedDepts.length > 0 && (
          <div>
            {!searchRes && <div className="section-label">Bo'limlar</div>}
            <div className="depts-grid">
              {displayedDepts.map(dept => (
                <div
                  key={dept.id}
                  className="dept-card"
                  style={{ borderColor: dept.color + '40' }}
                  onClick={() => { setActiveDept(dept.id); setView('doctors'); setSearchQ(''); setSearchRes(null) }}
                >
                  <div className="dept-card-icon" style={{ background: dept.color + '18', color: dept.color }}>
                    {dept.icon || '🏥'}
                  </div>
                  <div className="dept-card-name">{dept.name_uz}</div>
                  <div className="dept-card-count">
                    {dept.active_doctors_count} ta shifokor
                  </div>
                  {dept.description && (
                    <div className="dept-card-desc">{dept.description.slice(0, 60)}...</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DOCTORS VIEW ── */}
        {(view === 'doctors' || searchRes) && (
          <div>
            {/* Department filter chips */}
            {!searchRes && (
              <div className="dept-chips">
                <button
                  className={`dept-chip${!activeDept ? ' active' : ''}`}
                  onClick={() => setActiveDept(null)}
                >
                  Barchasi
                  <span className="dept-count">{doctors.length}</span>
                </button>
                {departments.map(d => (
                  <DeptChip
                    key={d.id} dept={d}
                    active={activeDept === d.id}
                    onClick={() => setActiveDept(activeDept === d.id ? null : d.id)}
                  />
                ))}
              </div>
            )}

            {/* Sort */}
            {!searchRes && (
              <div className="sort-row">
                <span className="sort-label">Saralash:</span>
                {[
                  { val: '-rating', label: '⭐ Reyting' },
                  { val: '-years_of_experience', label: '🏆 Tajriba' },
                ].map(s => (
                  <button
                    key={s.val}
                    className={`sort-btn${sortBy === s.val ? ' active' : ''}`}
                    onClick={() => setSortBy(s.val)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Doctor cards */}
            {displayedDoctors.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 48, marginBottom: 14 }}>👨‍⚕️</div>
                <div className="empty-title">Doktor topilmadi</div>
                <div className="empty-sub">Boshqa bo'limni tanlang</div>
              </div>
            ) : (
              <div className="docs-grid">
                {displayedDoctors.map(doc => (
                  <DoctorCard
                    key={doc.id}
                    doc={doc}
                    onBook={setBookDoc}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Book modal ── */}
      {bookDoc && (
        <BookModal
          doctor={bookDoc}
          onClose={() => setBookDoc(null)}
          onSuccess={() => {
            setBookDoc(null)
            setShowSuccess(true)
          }}
        />
      )}

      {showSuccess && <SuccessToast onClose={() => setShowSuccess(false)} />}
    </>
  )
}

function DeptSkeleton() {
  return (
    <>
      <style>{CSS}</style>
      <div className="dept-root">
        <div className="skel" style={{ height: 28, width: '60%', borderRadius: 8, marginBottom: 8 }} />
        <div className="skel" style={{ height: 16, width: '40%', borderRadius: 8, marginBottom: 20 }} />
        <div className="skel" style={{ height: 44, borderRadius: 14, marginBottom: 16 }} />
        <div className="docs-grid">
          {[1,2,3,4].map(i => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
              <div className="skel" style={{ height: 64, width: 64, borderRadius: 20, margin: '0 auto 12px' }} />
              <div className="skel" style={{ height: 16, width: '70%', margin: '0 auto 8px', borderRadius: 6 }} />
              <div className="skel" style={{ height: 12, width: '50%', margin: '0 auto', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');

  .dept-root {
    min-height: 100vh; background: var(--bg);
    padding: 20px 16px 32px;
    max-width: 860px; margin: 0 auto;
    font-family: 'DM Sans', sans-serif; color: var(--text-primary);
  }

  /* Header */
  .dept-header { margin-bottom: 20px; }
  .dept-title {
    font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800;
    letter-spacing: -0.5px; color: var(--text-primary); margin-bottom: 4px;
  }
  .dept-sub { font-size: 13px; color: var(--text-muted); }

  /* Search */
  .search-wrap {
    position: relative; display: flex; align-items: center;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; padding: 0 14px;
    margin-bottom: 16px; transition: border-color 0.2s;
  }
  .search-wrap:focus-within { border-color: var(--accent-border); }
  .search-icon { font-size: 18px; flex-shrink: 0; }
  .search-input {
    flex: 1; background: none; border: none; outline: none;
    padding: 13px 10px; font-family: 'DM Sans', sans-serif;
    font-size: 14px; color: var(--text-primary);
  }
  .search-input::placeholder { color: var(--text-muted); }
  .search-clear {
    background: none; border: none; cursor: pointer;
    color: var(--text-muted); font-size: 16px; padding: 4px;
    border-radius: 6px; transition: color 0.15s;
  }
  .search-clear:hover { color: var(--text-primary); }
  .search-spin {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid var(--border); border-top-color: var(--accent);
    animation: spin 0.6s linear infinite; flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .search-results-label { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; }

  /* View toggle */
  .view-toggle {
    display: flex; gap: 6px; margin-bottom: 16px;
    background: var(--surface); border-radius: 12px; padding: 4px;
    border: 1px solid var(--border); width: fit-content;
  }
  .vt-btn {
    padding: 8px 16px; border-radius: 9px; border: none;
    background: none; cursor: pointer; font-size: 13px; font-weight: 500;
    color: var(--text-muted); font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
  }
  .vt-btn.active { background: var(--accent-dim); color: var(--accent); }

  /* Departments grid */
  .section-label {
    font-size: 12px; text-transform: uppercase; letter-spacing: 0.8px;
    color: var(--text-muted); font-weight: 600; margin-bottom: 12px;
  }
  .depts-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px; margin-bottom: 24px;
  }
  .dept-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; padding: 16px; cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s, border-color 0.2s;
    text-align: center;
  }
  .dept-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
  .dept-card-icon {
    width: 48px; height: 48px; border-radius: 14px; margin: 0 auto 10px;
    display: flex; align-items: center; justify-content: center; font-size: 22px;
  }
  .dept-card-name {
    font-size: 14px; font-weight: 700; color: var(--text-primary);
    font-family: 'Syne', sans-serif; margin-bottom: 4px;
  }
  .dept-card-count { font-size: 11px; color: var(--text-muted); margin-bottom: 6px; }
  .dept-card-desc { font-size: 11px; color: var(--text-muted); line-height: 1.5; }

  /* Dept chips */
  .dept-chips {
    display: flex; gap: 8px; overflow-x: auto;
    padding-bottom: 4px; margin-bottom: 14px; scrollbar-width: none;
  }
  .dept-chips::-webkit-scrollbar { display: none; }
  .dept-chip {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 20px;
    border: 1px solid var(--border); background: none; cursor: pointer;
    font-size: 13px; font-weight: 500; color: var(--text-muted);
    font-family: 'DM Sans', sans-serif; white-space: nowrap;
    transition: all 0.2s;
  }
  .dept-chip.active { background: var(--accent-dim); border-color: var(--accent-border); color: var(--accent); }
  .dept-count {
    background: var(--hover); padding: 1px 7px; border-radius: 10px;
    font-size: 11px; font-weight: 600;
  }

  /* Sort */
  .sort-row { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
  .sort-label { font-size: 12px; color: var(--text-muted); }
  .sort-btn {
    padding: 5px 12px; border-radius: 20px;
    border: 1px solid var(--border); background: none; cursor: pointer;
    font-size: 12px; color: var(--text-muted);
    font-family: 'DM Sans', sans-serif; transition: all 0.15s;
  }
  .sort-btn.active { background: var(--accent-dim); border-color: var(--accent-border); color: var(--accent); }

  /* Doctors grid */
  .docs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }

  /* Doctor card */
  .doc-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 18px; padding: 18px;
    display: flex; flex-direction: column; gap: 12px;
    position: relative; overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
    animation: cardIn 0.3s ease both;
  }
  .doc-card:hover {
    border-color: var(--accent-border);
    box-shadow: 0 8px 28px rgba(0,200,170,0.1);
    transform: translateY(-2px);
  }
  .doc-card.unavailable { opacity: 0.7; }
  @keyframes cardIn { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }

  .avail-badge {
    position: absolute; top: 14px; right: 14px;
    display: flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
  }
  .avail-badge.on { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
  .avail-badge.off { background: var(--hover); color: var(--text-muted); border: 1px solid var(--border); }
  .avail-dot {
    width: 6px; height: 6px; border-radius: 50%;
  }
  .avail-badge.on .avail-dot { background: #10b981; animation: pulse 2s infinite; }
  .avail-badge.off .avail-dot { background: var(--text-muted); }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .doc-photo-wrap { display: flex; justify-content: center; }
  .doc-photo { width: 72px; height: 72px; border-radius: 20px; object-fit: cover; border: 2px solid var(--border); }
  .doc-initials {
    width: 72px; height: 72px; border-radius: 20px;
    background: linear-gradient(135deg, rgba(82,130,255,0.15), rgba(0,200,170,0.15));
    border: 1px solid var(--accent-border);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--accent);
  }

  .doc-info { display: flex; flex-direction: column; gap: 4px; }
  .doc-name { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--text-primary); }
  .doc-spec { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
  .doc-dept { font-size: 12px; color: var(--text-muted); }

  .stars-wrap { display: flex; align-items: center; gap: 4px; margin-top: 4px; }
  .rating-num { font-size: 12px; color: var(--text-muted); font-weight: 600; }

  .doc-meta-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
  .doc-meta-item { font-size: 11px; color: var(--text-muted); background: var(--hover); padding: 3px 8px; border-radius: 8px; }

  .doc-fee { font-size: 13px; font-weight: 600; color: var(--accent); }

  .doc-book-btn {
    width: 100%; padding: 11px;
    background: linear-gradient(135deg, #00c8aa, #00a88c);
    border: none; border-radius: 12px;
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
    color: #060a12; cursor: pointer; margin-top: auto;
    transition: opacity 0.2s, transform 0.15s;
  }
  .doc-book-btn:hover:not(.disabled) { opacity: 0.88; transform: translateY(-1px); }
  .doc-book-btn.disabled {
    background: var(--hover); color: var(--text-muted);
    border: 1px solid var(--border); cursor: not-allowed;
  }

  /* Empty */
  .empty-state { text-align: center; padding: 60px 20px; }
  .empty-title { font-family: 'Syne', sans-serif; font-size: 18px; color: var(--text-secondary); margin-bottom: 8px; }
  .empty-sub { font-size: 13px; color: var(--text-muted); }

  /* Skeleton */
  .skel {
    background: linear-gradient(90deg, var(--hover) 25%, var(--border) 50%, var(--hover) 75%);
    background-size: 200% 100%; animation: shimmer 1.4s infinite;
  }
  @keyframes shimmer { to { background-position: -200% 0; } }

  @media (max-width: 480px) {
    .docs-grid { grid-template-columns: 1fr; }
    .depts-grid { grid-template-columns: repeat(2, 1fr); }
  }
`