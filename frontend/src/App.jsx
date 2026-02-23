import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AiAssistantPage from './pages/AiAssistantPage'
import AppointmentsPage from './pages/AppointmentsPage'
import DaftarPage from './pages/DaftarPage'
import DepartmentsPage from './pages/DepartmentsPage'
import PrescriptionsPage from './pages/PrescriptionsPage'
import BarcodeScannerPage from './pages/BarcodeScannerPage'
import ProfilePage from './pages/ProfilePage'
import PatientDashboard from './pages/PatientDashboard'



function Placeholder({ text, color = 'var(--text-primary)' }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color, fontFamily: 'DM Sans, sans-serif' }}>
      {text}
    </div>
  )
}

const DoctorDashboard = () => <Placeholder text="🩺 Doktor Dashboard" />
const Unauthorized = () => <Placeholder text="🚫 Ruxsat yo'q" color="#ff5050" />

function AppRoute({ children, allowedRoles }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

            <Route path="/dashboard/doctor"  element={<AppRoute allowedRoles={['ADMIN']}><DoctorDashboard /></AppRoute>} />
            <Route path="/dashboard/patient" element={<AppRoute allowedRoles={['PATIENT']}><PatientDashboard /></AppRoute>} />

            <Route path="/appointments" element={<AppRoute><AppointmentsPage /></AppRoute>} />
            <Route path="/ai"           element={<AppRoute><AiAssistantPage /></AppRoute>} />
            <Route path="/profile"      element={<AppRoute><ProfilePage /></AppRoute>} />
            <Route path="/daftar"       element={<AppRoute allowedRoles={['PATIENT']}><DaftarPage /></AppRoute>} />
            <Route path="/departments"  element={<AppRoute><DepartmentsPage /></AppRoute>} />
            <Route path="/prescriptions" element={<AppRoute allowedRoles={['PATIENT']}><PrescriptionsPage /></AppRoute>} />
            <Route path="/scan"         element={<BarcodeScannerPage />} />

            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/" element={<Navigate to="/appointments" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}