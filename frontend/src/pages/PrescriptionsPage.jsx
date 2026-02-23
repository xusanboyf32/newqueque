import { useState, useEffect } from 'react'
import { prescriptionsAPI } from '../api/prescriptions'

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })
  : '—'

function PriceBreakdown({ item }) {
  if (!item.unit_price || item.unit_price <= 0) return null

  const isVolume = item.measure_type === 'volume'
  const isInjection = item.measure_type === 'injection'

  return (
    <div style={{
      background: 'rgba(16,185,129,0.06)',
      border: '1px solid rgba(16,185,129,0.15)',
      borderRadius: 10, padding: '10px 12px',
      marginBottom: 10, fontSize: 12,
    }}>
      {isVolume ? (
        // Spirt, malham — oddiy
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>1 {item.pack_unit} (kurs uchun yetarli)</span>
            <b style={{ color: '#10b981' }}>{item.total_price?.toLocaleString()} so'm</b>
        </div>
            ) : isInjection ? (
         <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--text-muted)' }}>
      <span>Kuniga × kun</span>
      <span>
        {item.doses_per_day} × {item.duration_days} =&nbsp;
        <b style={{ color: 'var(--text-primary)' }}>{item.total_doses_needed} ampula</b>
      </span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, marginTop: 4, borderTop: '1px solid rgba(16,185,129,0.2)', fontWeight: 700, color: '#10b981', fontSize: 13 }}>
      <span>Narxi</span>
      <span>{item.total_price?.toLocaleString()} so'm</span>
    </div>
    </>
      ) : (
        // Parasetamol — batafsil hisob
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--text-muted)' }}>
            <span>Kuniga × kun</span>
            <span>
              {item.doses_per_day} × {item.duration_days} =&nbsp;
              <b style={{ color: 'var(--text-primary)' }}>{item.total_doses_needed} dona</b>
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--text-muted)' }}>
            <span>1 {item.pack_unit}da</span>
            <b style={{ color: 'var(--text-primary)' }}>{item.units_per_pack} dona</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--text-muted)' }}>
            <span>Kerak {item.pack_unit}</span>
            <b style={{ color: 'var(--text-primary)' }}>{item.packs_needed} {item.pack_unit}</b>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            paddingTop: 8, marginTop: 4,
            borderTop: '1px solid rgba(16,185,129,0.2)',
            fontWeight: 700, color: '#10b981', fontSize: 13,
          }}>
            <span>Narxi</span>
            <span>{item.total_price?.toLocaleString()} so'm</span>
          </div>
        </>
      )}
    </div>
  )
}

// ── Retsept detail modal ──────────────────────────────────────────
function PrescriptionModal({ id, onClose }) {
  const [rx, setRx]         = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    prescriptionsAPI.getDetail(id)
      .then(setRx)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={e => e.target === e.currentTarget && onClose()}>

      <div style={{
        background: 'var(--surface)', width: '100%', maxWidth: 560,
        borderRadius: '20px 20px 0 0', maxHeight: '92vh',
        overflowY: 'auto', paddingBottom: 32,
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '12px auto 0' }} />

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
        ) : !rx ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Topilmadi</div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>
                  Retsept #{rx.id}
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {rx.diagnosis || 'Tashxis kiritilmagan'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Dr. {rx.doctor_name} • {rx.doctor_specialty}
                </div>
              </div>
              <button onClick={onClose} style={{
                width: 32, height: 32, borderRadius: 10,
                border: 'none', background: 'var(--hover)',
                cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)',
              }}>✕</button>
            </div>

            <div style={{ padding: '16px 20px' }}>

              {/* ── 1. DORILAR RO'YXATI ── */}
              <div style={{
                fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12,
              }}>
                💊 Dorilar ro'yxati
              </div>

              {rx.items?.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Dori kiritilmagan</div>
              ) : rx.items?.map((item, i) => (
                <div key={i} style={{
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: 14, marginBottom: 10,
                }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 8 }}>
                    💊 {item.medication_name}
                  </div>

                  {/* Narx hisob-kitob */}
                  <PriceBreakdown item={item} />

                  {/* Qabul rejimi */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ background: 'var(--hover)', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Necha mahal</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Kuniga {item.doses_per_day} mahal</div>
                    </div>
                    <div style={{ background: 'var(--hover)', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Davomiyligi</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.duration_days} kun</div>
                    </div>
                  </div>

                  {item.note && (
                    <div style={{
                      marginTop: 8, fontSize: 12, color: 'var(--text-muted)',
                      fontStyle: 'italic', padding: '6px 10px',
                      background: 'var(--hover)', borderRadius: 8,
                    }}>
                      📝 {item.note}
                    </div>
                  )}
                </div>
              ))}

              {/* ── 2. JAMI NARX ── */}
              {rx.total_cost > 0 && (
                <div style={{
                  margin: '16px 0',
                  padding: '14px 16px',
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: 14,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#10b981', marginBottom: 4, fontWeight: 600 }}>
                      💰 Jami taxminiy narx
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      * Aptekada farq qilishi mumkin
                    </div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>
                    {rx.total_cost?.toLocaleString()} so'm
                  </div>
                </div>
              )}

              {/* ── 3. BEMOR VA YAROQLILIK ── */}
              <div style={{
                padding: '12px 14px', background: 'var(--hover)',
                borderRadius: 12, marginBottom: 16,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Bemor</span>
                  <span style={{ fontWeight: 500 }}>{rx.patient_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Yaroqlilik muddati</span>
                  <span style={{ fontWeight: 500 }}>{formatDate(rx.valid_until)}</span>
                </div>
              </div>

              {/* ── 4. SHTRIX KOD ── */}
              {rx.barcode && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 12, color: 'var(--text-muted)', marginBottom: 8,
                    textTransform: 'uppercase', letterSpacing: '0.6px',
                  }}>
                    📊 Shtrix kod
                  </div>
                  {rx.barcode_image && (
                    <img src={rx.barcode_image} alt="barcode" style={{
                      maxWidth: '100%', borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: '#fff', padding: 8,
                    }} />
                  )}
                  <div style={{
                    fontSize: 13, color: 'var(--text-muted)',
                    marginTop: 6, fontFamily: 'monospace',
                    letterSpacing: 2,
                  }}>
                    {rx.barcode}
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Retsept karta ─────────────────────────────────────────────────
function PrescriptionCard({ rx, onClick }) {
  const isExpired = rx.valid_until && new Date(rx.valid_until) < new Date()

  return (
    <div onClick={onClick} style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: 16, cursor: 'pointer', marginBottom: 10,
      transition: 'border-color 0.2s, transform 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
    >
      {/* Top */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
            Retsept #{rx.id}
          </div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            {rx.diagnosis || 'Tashxis kiritilmagan'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Dr. {rx.doctor_name}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
          {/* Status badge */}
          <div style={{
            fontSize: 11, fontWeight: 600,
            color: isExpired ? '#ef4444' : '#10b981',
            background: isExpired ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
            border: `1px solid ${isExpired ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
            padding: '3px 10px', borderRadius: 20, marginBottom: 8,
          }}>
            {isExpired ? 'Muddati o\'tgan' : 'Faol'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            💊 {rx.items_count} ta dori
          </div>

          {/* Narx */}
          {rx.total_cost > 0 && (
            <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', marginTop: 4 }}>
              ~{rx.total_cost?.toLocaleString()} so'm
            </div>
          )}
        </div>
      </div>

      {/* Bottom */}
      <div style={{
        marginTop: 10, paddingTop: 10,
        borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, color: 'var(--text-muted)',
      }}>
        <span>📅 {formatDate(rx.created_at)}</span>
        <span>⏱ {formatDate(rx.valid_until)} gacha</span>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading]             = useState(true)
  const [selectedId, setSelectedId]       = useState(null)

  useEffect(() => {
    prescriptionsAPI.getMyPrescriptions()
      .then(data => setPrescriptions(Array.isArray(data) ? data : data?.results || []))
      .catch(() => setPrescriptions([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      padding: '20px 16px 32px',
      maxWidth: 640, margin: '0 auto',
      fontFamily: 'DM Sans, sans-serif',
    }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 26,
          fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4,
        }}>
          Retseptlarim
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {prescriptions.length} ta retsept
        </p>
      </div>

      {/* List */}
      {loading ? (
        [1, 2, 3].map(i => (
          <div key={i} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 16, marginBottom: 10,
          }}>
            <div style={{ height: 14, width: '40%', background: 'var(--hover)', borderRadius: 6, marginBottom: 8 }} />
            <div style={{ height: 20, width: '70%', background: 'var(--hover)', borderRadius: 6, marginBottom: 8 }} />
            <div style={{ height: 12, width: '50%', background: 'var(--hover)', borderRadius: 6 }} />
          </div>
        ))
      ) : prescriptions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>💊</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Retsept yo'q
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Hozircha doktor tomonidan retsept yozilmagan
          </div>
        </div>
      ) : (
        prescriptions.map(rx => (
          <PrescriptionCard
            key={rx.id}
            rx={rx}
            onClick={() => setSelectedId(rx.id)}
          />
        ))
      )}

      {/* Modal */}
      {selectedId && (
        <PrescriptionModal
          id={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}