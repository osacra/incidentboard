import { Navigate, Outlet, useLocation } from 'react-router'
import { session } from '../api'

export default function ProtectedRoute() {
  const location = useLocation()
  return session.getToken() ? <Outlet /> : <Navigate to="/" replace state={{ from: location.pathname }} />
}
