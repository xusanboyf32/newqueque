import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { prescriptionsAPI } from '../api/prescriptions'

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })
  : '—'

export default function BarcodeScannerPage() {
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [manualBarcode, setManualBarcode] = useState('')
  const html5QrRef = useRef(null)

  const startScanner = async () => {
  setError(null)
  setResult(null)
  setScanning(true)
  setTimeout(async () => {
    try {
      html5QrRef.current = new Html5Qrcode('qr-reader')
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 400, height: 400 } },
        (decodedText) => { stopScanner(); handleBarcode(decodedText) },
        () => {}
      )
    } catch {
      setError('Kameraga ruxsat berilmadi')
      setScanning(false)
    }
  }, 100)
}

  const stopScanner = async () => {
    try {
      if (html5QrRef.current?.isScanning) {
        await html5QrRef.current.stop()
        html5QrRef.current.clear()
      }
    } catch {}
    setScanning(false)
  }

  const handleBarcode = async (rawBarcode) => {
  const barcode = rawBarcode.length === 12 ? '0' + rawBarcode : rawBarcode
  setLoading(true)
  setError(null)
  try {
    const data = await prescriptionsAPI.scanBarcode(barcode)
    setResult(data.prescription)
  } catch {
    setError("Retsept topilmadi. Shtrix kod noto'g'ri yoki mavjud emas.")
  } finally {
    setLoading(false)
  }
}

  const handleManualSubmit = () => {
    if (manualBarcode.trim().length === 13) {
      handleBarcode(manualBarcode.trim())
    } else {
      setError("Shtrix kod 13 ta raqamdan iborat bo'lishi kerak")
    }
  }

  const reset = () => { setResult(null); setError(null); setManualBarcode('') }

  useEffect(() => { return () => { stopScanner() } }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'DM Sans, sans-serif', maxWidth: 640, margin: '0 auto', padding: '20px 16px 40px' }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
          📊 Barcode Skanerlash
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Retsept shtrix kodini kamera bilan o'qing</p>
      </div>

      {result ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14, padding: '12px 16px', marginBottom: 20 }}>
            <span style={{ fontSize: 22 }}>✅</span>
            <div>
              <div style={{ fontWeight: 700, color: '#10b981', fontSize: 14 }}>Retsept topildi!</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Barcode: {result.barcode}</div>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 4 }}>Retsept #{result.id}</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>{result.diagnosis || 'Tashxis kiritilmagan'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Dr. {result.doctor_name} • {result.doctor_specialty}</div>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Bemor</span>
              <span style={{ fontWeight: 600 }}>{result.patient_name}</span>
            </div>
            <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Yaroqlilik muddati</span>
              <span style={{ fontWeight: 600, color: '#f59e0b' }}>{formatDate(result.valid_until)}</span>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
              💊 Dorilar ro'yxati ({result.items?.length} ta)
            </div>
            {result.items?.map((item, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 8 }}>💊 {item.medication_name || 'Dori'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: 'var(--hover)', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Necha mahal</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Kuniga {item.doses_per_day} mahal</div>                  </div>
                  <div style={{ background: 'var(--hover)', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Davomiyligi</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.duration_days} kun</div>                  </div>
                </div>
                {item.note && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 10px', background: 'var(--hover)', borderRadius: 8 }}>
                    📝 {item.note}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={reset} style={{ width: '100%', padding: 14, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 14, fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            🔄 Yangi skanerlash
          </button>
        </div>

      ) : (
        <>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ background: '#000', minHeight: scanning ? 'auto' : 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!scanning && (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                  <div style={{ color: '#666', fontSize: 14 }}>Kamera tayyor emas</div>
                </div>
              )}
              <div id="qr-reader" style={{ width: '100%' }} />
            </div>
            <div style={{ padding: 16 }}>
              {!scanning ? (
                <button onClick={startScanner} style={{ width: '100%', padding: 14, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  📷 Kamerani yoqish
                </button>
              ) : (
                <button onClick={stopScanner} style={{ width: '100%', padding: 14, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  ✕ To'xtatish
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>yoki qo'lda kiriting</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>📊 Shtrix kod raqami (13 xona)</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                value={manualBarcode}
                onChange={e => setManualBarcode(e.target.value)}
                placeholder="0000000000000"
                maxLength={13}
                style={{ flex: 1, padding: '12px 14px', background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 16, fontFamily: 'monospace', outline: 'none' }}
              />
              <button onClick={handleManualSubmit} style={{ padding: '12px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 18, cursor: 'pointer' }}>→</button>
            </div>
          </div>

          {loading && <div style={{ marginTop: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>⏳ Retsept qidirilmoqda...</div>}
          {error && <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: '#ef4444', fontSize: 13 }}>⚠️ {error}</div>}
        </>
      )}
    </div>
  )
}