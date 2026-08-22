import { Navigate, Outlet } from 'react-router'
import { session } from '../api'

type JwtPayload = { role?: string }

function getRole() {
  const token = session.getToken()
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    return (JSON.parse(window.atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as JwtPayload).role ?? null
  } catch {
    return null
  }
}

export default function AdminRoute() {
  return getRole() === 'admin' ? <Outlet /> : <Navigate to="/" replace />
}
