import { apiFetch } from './auth'

export const daftarAPI = {
  // O'z tibbiy daftarcham
  async getMyCard() {
    const res = await apiFetch('/api/daftar/medical-cards/me/')
    if (!res.ok) throw await res.json()
    return res.json()
  },

  // Barcha qabullar (encounters)
  async getEncounters() {
    const res = await apiFetch('/api/daftar/encounters/')
    if (!res.ok) throw await res.json()
    return res.json()
  },

  // Allergiyalar
  async getAllergies() {
    const res = await apiFetch('/api/daftar/allergies/')
    if (!res.ok) throw await res.json()
    return res.json()
  },

  // Surunkali kasalliklar
  async getChronicDiseases() {
    const res = await apiFetch('/api/daftar/chronic-diseases/')
    if (!res.ok) throw await res.json()
    return res.json()
  },

  // Vaksinalar
  async getVaccinations() {
    const res = await apiFetch('/api/daftar/vaccinations/')
    if (!res.ok) throw await res.json()
    return res.json()
  },

  // Retseptlar
  async getPrescriptions() {
    const res = await apiFetch('/api/daftar/prescriptions/')
    if (!res.ok) throw await res.json()
    return res.json()
  },
}