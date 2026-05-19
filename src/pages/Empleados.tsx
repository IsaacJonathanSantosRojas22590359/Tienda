import { useEffect, useState } from 'react'
import { Plus, Edit2, UserX, UserCheck } from 'lucide-react'
import cliente from '../api/cliente'
import toast from 'react-hot-toast'

interface Empleado {
  id: number; nombre: string; email: string; rol: string; activo: boolean
}

const formVacio = { nombre: '', email: '', password: '', rol: 'empleado' }

export default function Empleados() {
  const [empleados,  setEmpleados]  = useState<Empleado[]>([])
  const [showForm,   setShowForm]   = useState(false)
  const [editando,   setEditando]   = useState<Empleado | null>(null)
  const [form,       setForm]       = useState(formVacio)
  const [loading,    setLoading]    = useState(true)
  const [guardando,  setGuardando]  = useState(false)

  const cargar = () => {
    setLoading(true)
    cliente.get('/usuarios/')
      .then(res => setEmpleados(Array.isArray(res.data) ? res.data : res.data.results))
      .catch(()  => toast.error('Error al cargar empleados'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const abrirForm = (e: Empleado | null) => {
    setEditando(e)
    setForm(e ? { nombre: e.nombre, email: e.email, password: '', rol: e.rol } : formVacio)
    setShowForm(true)
  }

  const cerrar = () => { setShowForm(false); setEditando(null) }

  const guardar = async () => {
    if (!form.nombre || !form.email) {
      toast.error('Nombre y email son obligatorios'); return
    }
    if (!editando && !form.password) {
      toast.error('La contraseña es obligatoria'); return
    }
    setGuardando(true)
    try {
      if (editando) {
        await cliente.put(`/usuarios/${editando.id}/`, {
          nombre: form.nombre, email: form.email, rol: form.rol
        })
        toast.success('Empleado actualizado')
      } else {
        await cliente.post('/usuarios/crear/', form)
        toast.success('Empleado creado')
      }
      cerrar(); cargar()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const desactivar = async (id: number) => {
    if (!confirm('¿Desactivar este empleado?')) return
    try {
      await cliente.delete(`/usuarios/${id}/`)
      toast.success('Empleado desactivado')
      cargar()
    } catch {
      toast.error('Error al desactivar')
    }
  }

  const iniciales = (nombre: string) =>
    nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: 300 }}>
      <div className="spinner-border text-primary" />
    </div>
  )

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-semibold mb-0">Empleados</h4>
          <p className="text-muted small mb-0">{empleados.length} empleados activos</p>
        </div>
        <button className="btn btn-dark btn-sm d-flex align-items-center gap-2"
          onClick={() => abrirForm(null)}>
          <Plus size={14} /> Nuevo empleado
        </button>
      </div>

      <div className="row g-3 mb-4">
        {empleados.map(u => (
          <div key={u.id} className="col-12 col-md-6 col-lg-4">
            <div className="card h-100 text-center">
              <div className="card-body">
                <div className={`rounded-circle d-inline-flex align-items-center
                  justify-content-center mb-3
                  ${u.rol === 'admin'
                    ? 'bg-primary bg-opacity-10 text-primary'
                    : 'bg-secondary bg-opacity-10 text-secondary'}`}
                  style={{ width: 52, height: 52, fontSize: 16, fontWeight: 500 }}>
                  {iniciales(u.nombre)}
                </div>
                <h6 className="fw-semibold mb-1">{u.nombre}</h6>
                <p className="text-muted small mb-2">{u.email}</p>
                <span className={`badge mb-3 ${u.rol === 'admin' ? 'bg-primary' : 'bg-secondary'}`}>
                  {u.rol === 'admin' ? 'Administrador' : 'Empleado'}
                </span>
                <div className="d-flex gap-2 justify-content-center">
                  <button className="btn btn-outline-secondary btn-sm"
                    onClick={() => abrirForm(u)}>
                    <Edit2 size={13} className="me-1" />Editar
                  </button>
                  <button className="btn btn-outline-danger btn-sm"
                    onClick={() => desactivar(u.id)}>
                    <UserX size={13} className="me-1" />Desactivar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-semibold">
                  {editando ? 'Editar empleado' : 'Nuevo empleado'}
                </h6>
                <button className="btn-close" onClick={cerrar} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small">Nombre completo</label>
                  <input className="form-control form-control-sm"
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Nombre completo" />
                </div>
                <div className="mb-3">
                  <label className="form-label small">Correo electrónico</label>
                  <input type="email" className="form-control form-control-sm"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="correo@tienda.com" />
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small">
                      {editando ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                    </label>
                    <input type="password" className="form-control form-control-sm"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••" />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">Rol</label>
                    <select className="form-select form-select-sm"
                      value={form.rol}
                      onChange={e => setForm({ ...form, rol: e.target.value })}>
                      <option value="empleado">Empleado</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary btn-sm" onClick={cerrar}>
                  Cancelar
                </button>
                <button className="btn btn-dark btn-sm" onClick={guardar} disabled={guardando}>
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear empleado'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}