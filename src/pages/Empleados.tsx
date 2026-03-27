import { useState } from 'react'
import { Plus, Edit2, UserX } from 'lucide-react'
import type { Usuario } from '../types'

const empleadosDemo: Usuario[] = [
  { id: 1, nombre: 'Isaac Santos',       email: 'admin@tienda.com',  rol: 'admin'    },
  { id: 2, nombre: 'Juan Torres Medina', email: 'juan@tienda.com',   rol: 'empleado' },
  { id: 3, nombre: 'Carlos Ríos Sánchez',email: 'carlos@tienda.com', rol: 'empleado' },
]

export default function Empleados() {
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)

  const abrirForm = (u: Usuario | null) => { setEditando(u); setShowForm(true) }
  const cerrarForm = () => { setEditando(null); setShowForm(false) }

  const iniciales = (nombre: string) =>
    nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-semibold mb-0">Empleados</h4>
          <p className="text-muted small mb-0">{empleadosDemo.length} empleados activos</p>
        </div>
        <button className="btn btn-dark btn-sm d-flex align-items-center gap-2"
          onClick={() => abrirForm(null)}>
          <Plus size={14} /> Nuevo empleado
        </button>
      </div>

      <div className="row g-3 mb-4">
        {empleadosDemo.map(u => (
          <div key={u.id} className="col-12 col-md-6 col-lg-4">
            <div className="card h-100 text-center">
              <div className="card-body">
                <div
                  className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-3
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
                  <button className="btn btn-outline-danger btn-sm">
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
                <button className="btn-close" onClick={cerrarForm} />
              </div>
              <div className="modal-body">
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small">Nombre</label>
                    <input className="form-control form-control-sm"
                      placeholder="Nombre"
                      defaultValue={editando?.nombre.split(' ')[0] ?? ''} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">Apellido</label>
                    <input className="form-control form-control-sm"
                      placeholder="Apellido"
                      defaultValue={editando?.nombre.split(' ')[1] ?? ''} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label small">Correo electrónico</label>
                  <input type="email" className="form-control form-control-sm"
                    placeholder="correo@tienda.com"
                    defaultValue={editando?.email ?? ''} />
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small">Contraseña</label>
                    <input type="password" className="form-control form-control-sm"
                      placeholder={editando ? 'Dejar vacío para no cambiar' : '••••••'} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">Rol</label>
                    <select className="form-select form-select-sm"
                      defaultValue={editando?.rol ?? 'empleado'}>
                      <option value="empleado">Empleado</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary btn-sm"
                  onClick={cerrarForm}>Cancelar</button>
                <button className="btn btn-dark btn-sm">
                  {editando ? 'Guardar cambios' : 'Crear empleado'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}