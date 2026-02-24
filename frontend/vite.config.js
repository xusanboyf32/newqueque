import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: ['eduagent.uz', 'www.eduagent.uz'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
//```
//
//---
//
//## 3. `frontend/.env`
//```
//VITE_API_URL=http://localhost:8000