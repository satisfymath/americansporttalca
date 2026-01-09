// Router con guards para American Sport Demo
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated, isAdmin, isUser } from './state/auth'

// Pages (placeholder por ahora)
import Home from './pages/Home'
import Login from './pages/Login'
import Gate from './pages/Gate'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import CashSheet from './pages/CashSheet'
import MemberProfile360 from './pages/MemberProfile360'
import OnlinePayment from './pages/OnlinePayment'
import NotFound from './pages/NotFound'

// Guard para rutas de usuario
function UserGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (!isUser()) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

// Guard para rutas de admin
function AdminGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (!isAdmin()) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/gate" element={<Gate />} />
      <Route
        path="/me"
        element={
          <UserGuard>
            <UserDashboard />
          </UserGuard>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminDashboard />
          </AdminGuard>
        }
      />
      <Route
        path="/cash"
        element={
          <AdminGuard>
            <CashSheet />
          </AdminGuard>
        }
      />
      <Route
        path="/member/:id"
        element={
          <AdminGuard>
            <MemberProfile360 />
          </AdminGuard>
        }
      />
      <Route
        path="/pay"
        element={
          <UserGuard>
            <OnlinePayment />
          </UserGuard>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
