import { apiFetch } from "./auth";

const BASE = "/api/departments/";

// Public fetch — token kerak emas
async function publicFetch(path) {
  const res = await fetch(path);
  if (!res.ok) throw await res.json();
  return res.json();
}

// Auth fetch — token bilan
async function authFetch(path) {
  const res = await apiFetch(path);
  if (!res.ok) throw await res.json();
  return res.json();
}

export const departmentsAPI = {
  async getDepartments(search = "") {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    // Avval auth bilan, bo'lmasa public
    try {
      return await authFetch(`${BASE}${q}`);
    } catch {
      return await publicFetch(`${BASE}${q}`);
    }
  },

  async getDoctors(params = {}) {
    const q = new URLSearchParams(params).toString();
    const suffix = q ? `?${q}` : "";
    try {
      return await authFetch(`${BASE}/doctors/${suffix}`);
    } catch {
      return await publicFetch(`${BASE}/doctors/${suffix}`);
    }
  },

  async getDoctorsByDepartment(id) {
    try {
      return await authFetch(`${BASE}/${id}/doctors/`);
    } catch {
      return await publicFetch(`${BASE}/${id}/doctors/`);
    }
  },

  async getDoctor(id) {
    try {
      return await authFetch(`${BASE}/doctors/${id}/`);
    } catch {
      return await publicFetch(`${BASE}/doctors/${id}/`);
    }
  },

  async search(q) {
    try {
      return await authFetch(`${BASE}/search/?q=${encodeURIComponent(q)}`);
    } catch {
      return await publicFetch(`${BASE}/search/?q=${encodeURIComponent(q)}`);
    }
  },
};
