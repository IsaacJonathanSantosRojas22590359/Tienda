import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Productos from './pages/Productos'
import Ventas from './pages/Ventas'
import Empleados from './pages/Empleados'
import Reportes from './pages/Reportes'

function RutaProtegida({ children, soloAdmin = false }: {
  children: React.ReactNode
  soloAdmin?: boolean
}) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  if (soloAdmin && usuario.rol !== 'admin') return <Navigate to="/ventas" replace />
  return <>{children}</>
}

function RedirigirInicio() {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  return <Navigate to={usuario.rol === 'admin' ? '/dashboard' : '/ventas'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RutaProtegida><Layout /></RutaProtegida>}>
            <Route index element={<RedirigirInicio />} />
            <Route path="dashboard" element={<RutaProtegida soloAdmin><Dashboard /></RutaProtegida>} />
            <Route path="productos"  element={<RutaProtegida soloAdmin><Productos /></RutaProtegida>} />
            <Route path="ventas"     element={<Ventas />} />
            <Route path="empleados"  element={<RutaProtegida soloAdmin><Empleados /></RutaProtegida>} />
            <Route path="reportes"   element={<RutaProtegida soloAdmin><Reportes /></RutaProtegida>} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}