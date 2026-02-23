import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function FullScreenLoader() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#070b14',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.08)',
        borderTopColor: '#00c8aa',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// Faqat login bo'lgan user kirishi mumkin
export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }
  return children
}

// Login bo'lgan user login/register sahifasiga kira olmaydi
export function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <FullScreenLoader />
  if (user) {
    const dest = user.role === 'ADMIN' ? '/dashboard/doctor' : '/dashboard/patient'
    return <Navigate to={dest} replace />
  }
  return children
}
