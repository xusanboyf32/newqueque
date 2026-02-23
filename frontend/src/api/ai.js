import { apiFetch } from './auth'

export const aiAPI = {
  // Savol yuborish
  async chat({ question, conversation_id = null }) {
    const res = await apiFetch('/api/ai/chat/', {
      method: 'POST',
      body: JSON.stringify({ question, conversation_id }),
    })
    const data = await res.json()
    if (!res.ok) throw data
    return data
  },

  // Barcha suhbatlar ro'yxati
  async getConversations() {
    const res = await apiFetch('/api/ai/conversations/')
    if (!res.ok) throw await res.json()
    return res.json()
  },

  // Bitta suhbatni to'liq olish (xabarlar bilan)
  async getConversation(id) {
    const res = await apiFetch(`/api/ai/conversations/${id}/`)
    if (!res.ok) throw await res.json()
    return res.json()
  },

  // Suhbatni o'chirish
  async deleteConversation(id) {
    const res = await apiFetch(`/api/ai/conversations/${id}/delete/`, {
      method: 'DELETE',
    })
    if (!res.ok) throw await res.json()
    return true
  },
}