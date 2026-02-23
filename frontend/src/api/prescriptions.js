import { apiFetch } from './auth'

export const prescriptionsAPI = {
  // Bemorning retseptlari
  async getMyPrescriptions() {
    const res = await apiFetch('/api/prescriptions/my/')
    if (!res.ok) throw await res.json()
    return res.json()
  },

  // Retsept batafsil
  async getDetail(id) {
    const res = await apiFetch(`/api/prescriptions/${id}/`)
    if (!res.ok) throw await res.json()
    return res.json()
  },

  // Barcode skanerlash
  async scanBarcode(barcode) {
    const res = await apiFetch('/api/prescriptions/scan/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode })
    })
    if (!res.ok) throw await res.json()
    return res.json()
  },
}
