import { apiFetch } from './auth'

export const appointmentsAPI = {
  async getMyAppointments(params = {}) {
    const q = new URLSearchParams(params).toString()
    const res = await apiFetch(`/api/appointments/my/${q ? '?' + q : ''}`)
    if (!res.ok) throw await res.json()
    return res.json()
  },
  async create(data) {
    const res = await apiFetch('/api/appointments/create/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw json
    return json
  },
  async cancel(id) {
    const res = await apiFetch(`/api/appointments/${id}/cancel/`, { method: 'POST' })
    const json = await res.json()
    if (!res.ok) throw json
    return json
  },
  async getAvailableSlots(doctorId, date) {
    const res = await apiFetch(`/api/appointments/available-slots/?doctor=${doctorId}&date=${date}`)
    if (!res.ok) throw await res.json()
    return res.json()
  },
  async getWeekSchedule(doctorId, startDate) {
    const res = await apiFetch(`/api/appointments/week-schedule/?doctor=${doctorId}&start_date=${startDate}`)
    if (!res.ok) throw await res.json()
    return res.json()
  },
}