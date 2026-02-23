import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { daftarAPI } from '../api/daftar'

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })
  : '—'

const formatDateTime = (d) => d
  ? new Date(d).toLocaleString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—'

// ── CSS ────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  .df-root {
    min-height: 100vh;
    background: #060810;
    font-family: 'Outfit', sans-serif;
    color: #e8eaf0;
    padding-bottom: 80px;
    position: relative;
    overflow-x: hidden;
  }
  .df-root::before {
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
  .df-inner {
    position: relative;
    z-index: 1;
    max-width: 680px;
    margin: 0 auto;
    padding: 0 16px;
  }

  /* HERO HEADER */
  .df-hero {
    padding: 40px 0 24px;
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .df-avatar {
    width: 64px;
    height: 64px;
    border-radius: 18px;
    background: linear-gradient(135deg, #20c4b4, #0e8a80);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 800;
    color: #fff;
    flex-shrink: 0;
    box-shadow: 0 0 30px rgba(32,196,180,0.3);
  }
  .df-hero-info h1 {
    font-size: 22px;
    font-weight: 800;
    color: #fff;
    margin-bottom: 4px;
    letter-spacing: -0.5px;
  }
  .df-card-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #20c4b4;
    background: rgba(32,196,180,0.08);
    border: 1px solid rgba(32,196,180,0.2);
    padding: 3px 10px;
    border-radius: 6px;
    display: inline-block;
    margin-bottom: 6px;
  }
  .df-blood {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    color: #ff6b7a;
    background: rgba(255,107,122,0.1);
    border: 1px solid rgba(255,107,122,0.2);
    padding: 3px 10px;
    border-radius: 6px;
    margin-left: 6px;
  }

  /* STATS GRID */
  .df-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 24px;
  }
  .df-stat {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 14px 10px;
    text-align: center;
    transition: border-color 0.2s, background 0.2s;
  }
  .df-stat:hover {
    border-color: rgba(32,196,180,0.3);
    background: rgba(32,196,180,0.05);
  }
  .df-stat-icon { font-size: 20px; margin-bottom: 6px; display: block; }
  .df-stat-val {
    font-size: 22px;
    font-weight: 800;
    color: #fff;
    display: block;
    line-height: 1;
    margin-bottom: 4px;
  }
  .df-stat-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }

  /* TABS */
  .df-tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 20px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 5px;
  }
  .df-tab {
    flex: 1;
    padding: 9px 6px;
    border: none;
    background: transparent;
    color: #6b7280;
    font-family: 'Outfit', sans-serif;
    font-size: 12px;
    font-weight: 600;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
  .df-tab.active {
    background: rgba(32,196,180,0.12);
    color: #20c4b4;
    border: 1px solid rgba(32,196,180,0.25);
  }
  .df-tab-badge {
    background: rgba(32,196,180,0.2);
    color: #20c4b4;
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 10px;
  }

  /* SECTION CARD */
  .sc {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    margin-bottom: 12px;
    overflow: hidden;
  }
  .sc-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #e8eaf0;
    text-align: left;
  }
  .sc-icon { font-size: 18px; }
  .sc-title { font-size: 14px; font-weight: 700; flex: 1; }
  .sc-count {
    font-size: 11px;
    font-weight: 700;
    color: #20c4b4;
    background: rgba(32,196,180,0.1);
    border: 1px solid rgba(32,196,180,0.2);
    padding: 2px 8px;
    border-radius: 10px;
  }
  .sc-chevron { color: #6b7280; font-size: 12px; transition: transform 0.2s; }
  .sc-body { padding: 0 16px 16px; }
  .sc-empty { color: #4b5563; font-size: 13px; font-style: italic; }

  /* INFO ROW */
  .ir {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    font-size: 13px;
  }
  .ir:last-child { border-bottom: none; }
  .ir-label { color: #6b7280; }
  .ir-val { color: #e8eaf0; font-weight: 500; font-family: 'JetBrains Mono', monospace; font-size: 12px; }

  /* ENCOUNTER ITEM */
  .enc {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    margin-bottom: 10px;
    overflow: hidden;
    transition: border-color 0.2s;
  }
  .enc:hover { border-color: rgba(32,196,180,0.2); }
  .enc-hdr {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #e8eaf0;
    text-align: left;
  }
  .enc-reason { font-size: 14px; font-weight: 700; display: block; margin-bottom: 4px; }
  .enc-date { font-size: 11px; color: #6b7280; font-family: 'JetBrains Mono', monospace; }
  .enc-chev { color: #6b7280; font-size: 12px; transition: transform 0.2s; flex-shrink: 0; }
  .enc-body { padding: 0 16px 14px; }
  .enc-field { margin-bottom: 10px; }
  .enc-field-lbl { font-size: 10px; color: #20c4b4; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 4px; }
  .enc-field-val { font-size: 13px; color: #c9cdd4; line-height: 1.5; }
  .enc-sub-lbl { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.6px; margin: 12px 0 8px; }

  /* DIAG ROW */
  .diag-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    font-size: 13px;
    flex-wrap: wrap;
  }
  .diag-row:last-child { border-bottom: none; }

  /* RX */
  .rx-card {
    background: rgba(32,196,180,0.05);
    border: 1px solid rgba(32,196,180,0.1);
    border-radius: 10px;
    padding: 10px;
    margin-bottom: 8px;
  }
  .rx-note { font-size: 12px; color: #6b7280; margin-bottom: 8px; font-style: italic; }
  .rx-item { padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .rx-item:last-child { border-bottom: none; }
  .rx-med { font-size: 13px; font-weight: 600; color: #e8eaf0; margin-bottom: 2px; }
  .rx-meta { font-size: 11px; color: #6b7280; display: flex; gap: 6px; flex-wrap: wrap; }

  /* BADGE */
  .badge {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 6px;
    white-space: nowrap;
  }

  /* MED ITEM */
  .med-item {
    padding: 12px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .med-item:last-child { border-bottom: none; }
  .med-name { font-size: 14px; font-weight: 600; color: #e8eaf0; margin-bottom: 6px; }
  .med-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; color: #6b7280; }
  .med-note { font-size: 12px; color: #6b7280; margin-top: 6px; font-style: italic; }

  /* VAC ITEM */
  .vac-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    gap: 12px;
  }
  .vac-item:last-child { border-bottom: none; }
  .vac-name { font-size: 14px; font-weight: 600; color: #e8eaf0; margin-bottom: 4px; }
  .vac-date { font-size: 11px; color: #6b7280; font-family: 'JetBrains Mono', monospace; }
  .vac-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
  .vac-lot { font-size: 10px; color: #4b5563; font-family: 'JetBrains Mono', monospace; }

  /* EMPTY */
  .df-empty {
    text-align: center;
    padding: 60px 20px;
  }
  .df-empty-icon { font-size: 48px; margin-bottom: 16px; }
  .df-empty-title { font-size: 18px; font-weight: 700; color: #374151; margin-bottom: 8px; }
  .df-empty-sub { font-size: 13px; color: #4b5563; }

  /* SKELETON */
  .skel {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* GLOW LINE */
  .glow-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(32,196,180,0.4), transparent);
    margin: 24px 0;
  }

  [data-theme="light"] .df-root {
    background: #f0f4f8;
    color: #111827;
  }
  [data-theme="light"] .df-root::before {
    background-image:
      linear-gradient(rgba(0,150,136,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,150,136,0.05) 1px, transparent 1px);
  }
  [data-theme="light"] .df-stat {
    background: #ffffff;
    border: 1px solid #e5e7eb;
  }
  [data-theme="light"] .df-stat:hover {
    border-color: rgba(32,196,180,0.4);
    background: rgba(32,196,180,0.04);
  }
  [data-theme="light"] .df-stat-val { color: #111827; }
  [data-theme="light"] .df-tabs {
    background: #ffffff;
    border: 1px solid #e5e7eb;
  }
  [data-theme="light"] .df-tab { color: #6b7280; }
  [data-theme="light"] .sc {
    background: #ffffff;
    border: 1px solid #e5e7eb;
  }
  [data-theme="light"] .sc-header { color: #111827; }
  [data-theme="light"] .sc-title { color: #111827; }
  [data-theme="light"] .ir { border-bottom: 1px solid #f3f4f6; }
  [data-theme="light"] .ir-label { color: #6b7280; }
  [data-theme="light"] .ir-val { color: #111827; }
  [data-theme="light"] .enc {
    background: #ffffff;
    border: 1px solid #e5e7eb;
  }
  [data-theme="light"] .enc-hdr { color: #111827; }
  [data-theme="light"] .enc-reason { color: #111827; }
  [data-theme="light"] .enc-field-val { color: #374151; }
  [data-theme="light"] .rx-card {
    background: rgba(32,196,180,0.04);
    border: 1px solid rgba(32,196,180,0.15);
  }
  [data-theme="light"] .rx-med { color: #111827; }
  [data-theme="light"] .med-name { color: #111827; }
  [data-theme="light"] .vac-name { color: #111827; }
  [data-theme="light"] .df-empty-title { color: #9ca3af; }
  [data-theme="light"] .skel {
    background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
    background-size: 200% 100%;
  }
  [data-theme="light"] .glow-line {
    background: linear-gradient(90deg, transparent, rgba(32,196,180,0.3), transparent);
  }
`

// ── Components ─────────────────────────────────────────────────────

function SectionCard({ icon, title, count, children, empty }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="sc">
      <button className="sc-header" onClick={() => setOpen(v => !v)}>
        <span className="sc-icon">{icon}</span>
        <span className="sc-title">{title}</span>
        {count !== undefined && <span className="sc-count">{count}</span>}
        <span className="sc-chevron" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </button>
      {open && (
        <div className="sc-body">
          {children || <div className="sc-empty">{empty || "Ma'lumot yo'q"}</div>}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="ir">
      <span className="ir-label">{label}</span>
      <span className="ir-val">{value || '—'}</span>
    </div>
  )
}

function Badge({ text, color = '#20c4b4', bg = 'rgba(32,196,180,0.1)', border = 'rgba(32,196,180,0.2)' }) {
  return (
    <span className="badge" style={{ color, background: bg, border: `1px solid ${border}` }}>
      {text}
    </span>
  )
}

function EncounterItem({ enc }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="enc">
      <button className="enc-hdr" onClick={() => setOpen(v => !v)}>
        <div>
          <span className="enc-reason">{enc.reason}</span>
          <span className="enc-date">{formatDateTime(enc.came_at)}</span>
        </div>
        <span className="enc-chev" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </button>
      {open && (
        <div className="enc-body">
          {enc.complaint && <div className="enc-field"><div className="enc-field-lbl">Shikoyat</div><div className="enc-field-val">{enc.complaint}</div></div>}
          {enc.examination && <div className="enc-field"><div className="enc-field-lbl">Ko'rik natijasi</div><div className="enc-field-val">{enc.examination}</div></div>}
          {enc.general_note && <div className="enc-field"><div className="enc-field-lbl">Umumiy izoh</div><div className="enc-field-val">{enc.general_note}</div></div>}

          {enc.diagnoses?.length > 0 && (
            <>
              <div className="enc-sub-lbl">🔬 Tashxislar</div>
              {enc.diagnoses.map(d => (
                <div className="diag-row" key={d.id}>
                  <span style={{ fontSize: 13, color: '#e8eaf0' }}>{d.disease_name}</span>
                  {d.icd10 && <Badge text={`ICD: ${d.icd10}`} color="#5282ff" bg="rgba(82,130,255,0.1)" border="rgba(82,130,255,0.2)" />}
                  {d.is_primary && <Badge text="Asosiy" color="#f59e0b" bg="rgba(245,158,11,0.1)" border="rgba(245,158,11,0.2)" />}
                </div>
              ))}
            </>
          )}


        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────
export default function DaftarPage() {
  const { user } = useAuth()
  const [card, setCard] = useState(null)
  const [encounters, setEncounters] = useState([])
  const [allergies, setAllergies] = useState([])
  const [chronic, setChronic] = useState([])
  const [vaccines, setVaccines] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    Promise.all([
      daftarAPI.getMyCard().catch(() => null),
      daftarAPI.getEncounters().catch(() => []),
      daftarAPI.getAllergies().catch(() => []),
      daftarAPI.getChronicDiseases().catch(() => []),
      daftarAPI.getVaccinations().catch(() => []),
    ]).then(([c, e, a, ch, v]) => {
      setCard(c)
      setEncounters(Array.isArray(e) ? e : e?.results || [])
      setAllergies(Array.isArray(a) ? a : a?.results || [])
      setChronic(Array.isArray(ch) ? ch : ch?.results || [])
      setVaccines(Array.isArray(v) ? v : v?.results || [])
    }).finally(() => setLoading(false))
  }, [])

  const TABS = [
    { key: 'overview', label: 'Umumiy', icon: '📋' },
    { key: 'encounters', label: 'Qabullar', icon: '🩺', count: encounters.length },
    { key: 'medical', label: 'Tibbiy', icon: '❤️' },
    { key: 'vaccines', label: 'Vaksinalar', icon: '💉', count: vaccines.length },
  ]

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="df-root">
        <div className="df-inner">
          <div style={{ paddingTop: 40 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ marginBottom: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
                <div className="skel" style={{ height: 18, width: '50%', marginBottom: 12 }} />
                <div className="skel" style={{ height: 14, width: '75%', marginBottom: 8 }} />
                <div className="skel" style={{ height: 14, width: '40%' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{CSS}</style>
      <div className="df-root">
        <div className="df-inner">

          {/* HERO */}
          <div className="df-hero">
            <div className="df-avatar">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="df-hero-info">
              <h1>{user?.first_name} {user?.last_name}</h1>
              <div className="df-card-num">#{card?.card_number || '—'}</div>
              {card?.blood_group && <span className="df-blood">🩸 {card.blood_group}</span>}
            </div>
          </div>

          {/* STATS */}
          <div className="df-stats">
            {[
              { icon: '🩺', label: 'Qabullar', val: encounters.length },
              { icon: '🤧', label: 'Allergiya', val: allergies.length },
              { icon: '💊', label: 'Kasallik', val: chronic.length },
              { icon: '💉', label: 'Vaksina', val: vaccines.length },
            ].map(s => (
              <div className="df-stat" key={s.label}>
                <span className="df-stat-icon">{s.icon}</span>
                <span className="df-stat-val">{s.val}</span>
                <span className="df-stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="glow-line" />

          {/* TABS */}
          <div className="df-tabs">
            {TABS.map(t => (
              <button
                key={t.key}
                className={`df-tab${activeTab === t.key ? ' active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.icon} {t.label}
                {t.count > 0 && <span className="df-tab-badge">{t.count}</span>}
              </button>
            ))}
          </div>

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <SectionCard icon="👤" title="Shaxsiy ma'lumotlar">
                <InfoRow label="Ism" value={card?.first_name} />
                <InfoRow label="Familiya" value={card?.last_name} />
                <InfoRow label="Tug'ilgan" value={formatDate(card?.birth_date)} />
                <InfoRow label="Telefon" value={card?.phone} />
                <InfoRow label="Qon guruhi" value={card?.blood_group} />
                <InfoRow label="Daftar raqami" value={card?.card_number} />
              </SectionCard>

              {encounters[0] && (
                <SectionCard icon="🕐" title="Oxirgi qabul">
                  <InfoRow label="Sabab" value={encounters[0].reason} />
                  <InfoRow label="Sana" value={formatDateTime(encounters[0].came_at)} />
                  {encounters[0].diagnoses?.[0] && (
                    <InfoRow label="Tashxis" value={encounters[0].diagnoses[0].disease_name} />
                  )}
                  <button
                    onClick={() => setActiveTab('encounters')}
                    style={{ marginTop: 12, background: 'none', border: 'none', color: '#20c4b4', fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'Outfit, sans-serif' }}
                  >
                    Barcha qabullarni ko'rish →
                  </button>
                </SectionCard>
              )}
            </div>
          )}

          {/* ENCOUNTERS */}
          {activeTab === 'encounters' && (
            encounters.length === 0 ? (
              <div className="df-empty">
                <div className="df-empty-icon">🩺</div>
                <div className="df-empty-title">Qabullar yo'q</div>
                <div className="df-empty-sub">Hozircha hech qanday qabul qayd etilmagan</div>
              </div>
            ) : (
              encounters.map(enc => <EncounterItem key={enc.id} enc={enc} />)
            )
          )}

          {/* MEDICAL */}
          {activeTab === 'medical' && (
            <div>
              <SectionCard icon="🤧" title="Allergiyalar" count={allergies.length} empty="Allergiyalar qayd etilmagan">
                {allergies.length > 0 && allergies.map(a => (
                  <div className="med-item" key={a.id}>
                    <div className="med-name">{a.allergen}</div>
                    <div className="med-meta">
                      {a.reaction && <span>{a.reaction}</span>}
                      {a.severity && <Badge text={a.severity} color="#f59e0b" bg="rgba(245,158,11,0.1)" border="rgba(245,158,11,0.2)" />}
                      {a.noted_at && <span>{formatDate(a.noted_at)}</span>}
                    </div>
                  </div>
                ))}
              </SectionCard>

              <SectionCard icon="💊" title="Surunkali kasalliklar" count={chronic.length} empty="Surunkali kasalliklar qayd etilmagan">
                {chronic.length > 0 && chronic.map(c => (
                  <div className="med-item" key={c.id}>
                    <div className="med-name">{c.name}</div>
                    <div className="med-meta">
                      {c.status && <Badge text={c.status} />}
                      {c.diagnosed_at && <span>{formatDate(c.diagnosed_at)}</span>}
                    </div>
                    {c.note && <div className="med-note">{c.note}</div>}
                  </div>
                ))}
              </SectionCard>
            </div>
          )}

          {/* VACCINES */}
          {activeTab === 'vaccines' && (
            vaccines.length === 0 ? (
              <div className="df-empty">
                <div className="df-empty-icon">💉</div>
                <div className="df-empty-title">Vaksinalar yo'q</div>
                <div className="df-empty-sub">Hozircha vaksinalar qayd etilmagan</div>
              </div>
            ) : (
              <div className="sc" style={{ padding: '0 16px' }}>
                {vaccines.map(v => (
                  <div className="vac-item" key={v.id}>
                    <div>
                      <div className="vac-name">{v.vaccine_name}</div>
                      <div className="vac-date">{formatDateTime(v.came_at)}</div>
                    </div>
                    <div className="vac-right">
                      {v.dose && <Badge text={`Doza: ${v.dose}`} />}
                      {v.lot_number && <span className="vac-lot">Partiya: {v.lot_number}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

        </div>
      </div>
    </>
  )
}