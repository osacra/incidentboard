import { Route, Routes } from 'react-router'
import App from './App'

export default function AppRoutes() {
  return <Routes>
    <Route path="/" element={<App />} />
    <Route path="/incidents" element={<App />} />
    <Route path="/incidents/:incidentId" element={<App />} />
    <Route path="*" element={<App />} />
  </Routes>
}
