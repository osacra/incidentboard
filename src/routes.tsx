import { Navigate, Route, Routes } from 'react-router'
import App from './App'
import AdminRoute from './routes/AdminRoute'
import DashboardPage from './pages/DashboardPage'
import IncidentDetailsPage from './pages/IncidentDetailsPage'
import IncidentsPage from './pages/IncidentsPage'
import ProtectedRoute from './routes/ProtectedRoute'

export default function AppRoutes() {
  return <Routes>
    <Route path="/" element={<App />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/incidents" element={<IncidentsPage />} />
      <Route path="/incidents/:incidentId" element={<IncidentDetailsPage />} />
      <Route element={<AdminRoute />}>
        <Route path="/admin/users" element={<Navigate to="/" replace />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
