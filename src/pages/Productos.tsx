import { useState } from 'react'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import type { Producto } from '../types'
const productosDemo: Producto[] = [
  { id: 1, nombre: 'Coca-Cola 600ml',    precio: 18,   stock: 142, descripcion: 'Botella PET',     categoria: 'Bebidas',  activo: true },
  { id: 2, nombre: 'Sabritas orig. 45g', precio: 16.5, stock: 8,   descripcion: 'Papas fritas',    categoria: 'Botanas',  activo: true },
  { id: 3, nombre: 'Agua mineral 1L',    precio: 12,   stock: 95,  descripcion: 'Agua con gas',    categoria: 'Bebidas',  activo: true },
  { id: 4, nombre: 'Pan Bimbo blanco',   precio: 45,   stock: 34,  descripcion: 'Pan de caja',     categoria: 'Abarrotes',activo: true },
  { id: 5, nombre: 'Leche Lala 1L',      precio: 28,   stock: 22,  descripcion: 'Leche entera',    categoria: 'Lácteos',  activo: true },
]

const categorias = ['Todas', 'Bebidas', 'Botanas', 'Abarrotes', 'Lácteos']

export default function Productos() {
  const [busqueda, setBusqueda]   = useState('')
  const [categoria, setCategoria] = useState('Todas')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando]   = useState<Producto | null>(null)

  const filtrados = productosDemo.filter(p => {
    const coincideNombre = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const coincideCat    = categoria === 'Todas' || p.categoria === categoria
    return coincideNombre && coincideCat
  })

  const abrirModal = (p: Producto | null) => { setEditando(p); setShowModal(true) }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-semibold mb-0">Productos</h4>
          <p className="text-muted small mb-0">{filtrados.length} productos encontrados</p>
        </div>
        <button className="btn btn-dark btn-sm d-flex align-items-center gap-2"
          onClick={() => abrirModal(null)}>
          <Plus size={14} /> Nuevo producto
        </button>
      </div>

      {/* Filtros */}
      <div className="card mb-3">
        <div className="card-body py-2">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text"><Search size={14} /></span>
                <input className="form-control" placeholder="Buscar producto..."
                  value={busqueda} onChange={e => setBusqueda(e.target.value)} />
              </div>
            </div>
            <div className="col-6 col-md-3">
              <select className="form-select form-select-sm"
                value={categoria} onChange={e => setCategoria(e.target.value)}>
                {categorias.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-2">
              <button className="btn btn-outline-secondary btn-sm w-100"
                onClick={() => { setBusqueda(''); setCategoria('Todas') }}>
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Nombre</th><th>Categoría</th>
                  <th>Precio</th><th>Stock</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(p => (
                  <tr key={p.id}>
                    <td>
                      <span className="fw-medium">{p.nombre}</span>
                      <br /><small className="text-muted">{p.descripcion}</small>
                    </td>
                    <td><span className="badge bg-secondary-subtle text-secondary">{p.categoria}</span></td>
                    <td>${p.precio.toFixed(2)}</td>
                    <td>
                      <span className={p.stock < 10 ? 'text-warning fw-medium' : 'text-success fw-medium'}>
                        {p.stock}
                      </span>
                      {p.stock < 10 && <small className="text-warning ms-1">· stock bajo</small>}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button className="btn btn-outline-secondary btn-sm"
                          onClick={() => abrirModal(p)}>
                          <Edit2 size={13} />
                        </button>
                        <button className="btn btn-outline-danger btn-sm">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Paginación */}
          <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top">
            <small className="text-muted">Mostrando {filtrados.length} resultados</small>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className="page-item disabled"><a className="page-link">‹</a></li>
                <li className="page-item active"><a className="page-link">1</a></li>
                <li className="page-item"><a className="page-link">2</a></li>
                <li className="page-item"><a className="page-link">›</a></li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* Modal crear/editar */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-semibold">
                  {editando ? 'Editar producto' : 'Nuevo producto'}
                </h6>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small">Nombre</label>
                  <input className="form-control form-control-sm"
                    defaultValue={editando?.nombre} placeholder="Nombre del producto" />
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small">Precio ($)</label>
                    <input type="number" className="form-control form-control-sm"
                      defaultValue={editando?.precio} placeholder="0.00" step="0.01" />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">Stock</label>
                    <input type="number" className="form-control form-control-sm"
                      defaultValue={editando?.stock} placeholder="0" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label small">Categoría</label>
                  <select className="form-select form-select-sm">
                    {categorias.filter(c => c !== 'Todas').map(c => (
                      <option key={c} selected={editando?.categoria === c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label small">Descripción</label>
                  <textarea className="form-control form-control-sm" rows={2}
                    defaultValue={editando?.descripcion} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary btn-sm"
                  onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn btn-dark btn-sm">
                  {editando ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}