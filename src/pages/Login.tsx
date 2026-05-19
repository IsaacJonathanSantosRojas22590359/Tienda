import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import cliente from '../api/cliente'
import toast from 'react-hot-toast'

export default function Login() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await cliente.post('/auth/login/', { email, password })
      const { access, refresh, usuario } = res.data

      login(access, refresh, usuario)
      toast.success(`Bienvenido, ${usuario.nombre}`)
      navigate(usuario.rol === 'admin' ? '/dashboard' : '/ventas', { replace: true })

    } catch (err: any) {
      const msg = err.response?.data?.error || 'Usuario o contraseña incorrectos'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm" style={{ width: 380 }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <div className="bg-primary bg-opacity-10 rounded d-inline-flex p-2 mb-3">
              <span style={{ fontSize: 24 }}>🏪</span>
            </div>
            <h5 className="fw-semibold mb-1">Sistema de tienda</h5>
            <p className="text-muted small">Ingresa con tus credenciales</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-medium">Correo electrónico</label>
              <input type="email" className="form-control"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="correo@tienda.com" required />
            </div>
            <div className="mb-4">
              <label className="form-label small fw-medium">Contraseña</label>
              <input type="password" className="form-control"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-dark w-100" disabled={loading}>
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-muted small mt-3 mb-0">
            Roles: Administrador · Empleado
          </p>
        </div>
      </div>
    </div>
  )
}