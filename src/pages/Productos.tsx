import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import cliente from '../api/cliente'
import toast from 'react-hot-toast'

interface Producto {
  id:              number
  nombre:          string
  precio:          string
  stock:           number
  descripcion:     string
  categoria:       number
  categoria_nombre:string
  activo:          boolean
}

interface Categoria {
  id:     number
  nombre: string
}

const productoVacio = {
  nombre: '', precio: '', stock: 0,
  descripcion: '', categoria: 1
}

export default function Productos() {
  const [productos,   setProductos]   = useState<Producto[]>([])
  const [categorias,  setCategorias]  = useState<Categoria[]>([])
  const [busqueda,    setBusqueda]    = useState('')
  const [categoria,   setCategoria]   = useState('Todas')
  const [showModal,   setShowModal]   = useState(false)
  const [editando,    setEditando]    = useState<Producto | null>(null)
  const [form,        setForm]        = useState(productoVacio)
  const [loading,     setLoading]     = useState(true)
  const [guardando,   setGuardando]   = useState(false)

  const cargarDatos = () => {
    setLoading(true)
    Promise.all([
      cliente.get('/productos/'),
      cliente.get('/categorias/'),
    ]).then(([prodRes, catRes]) => {
      setProductos(prodRes.data)
      setCategorias(catRes.data)
    }).catch(() => toast.error('Error al cargar productos'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargarDatos() }, [])

  const abrirModal = (p: Producto | null) => {
    setEditando(p)
    setForm(p
      ? { nombre: p.nombre, precio: p.precio, stock: p.stock, descripcion: p.descripcion ?? '', categoria: p.categoria }
      : productoVacio
    )
    setShowModal(true)
  }

  const cerrarModal = () => { setShowModal(false); setEditando(null) }

  const guardar = async () => {
    if (!form.nombre || !form.precio) {
      toast.error('Nombre y precio son obligatorios')
      return
    }
    setGuardando(true)
    try {
      if (editando) {
        await cliente.put(`/productos/${editando.id}/`, form)
        toast.success('Producto actualizado')
      } else {
        await cliente.post('/productos/', form)
        toast.success('Producto creado')
      }
      cerrarModal()
      cargarDatos()
    } catch {
      toast.error('Error al guardar el producto')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      await cliente.delete(`/productos/${id}/`)
      toast.success('Producto eliminado')
      cargarDatos()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const filtrados = productos.filter(p => {
    const coincideNombre = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const coincideCat    = categoria === 'Todas' || p.categoria_nombre === categoria
    return coincideNombre && coincideCat
  })

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: 300 }}>
      <div className="spinner-border text-primary" />
    </div>
  )

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
                <option>Todas</option>
                {categorias.map(c => <option key={c.id}>{c.nombre}</option>)}
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
                    <td><span className="badge-pastel-blue">{p.categoria_nombre}</span></td>
                    <td>${Number(p.precio).toFixed(2)}</td>
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
                        <button className="btn btn-outline-danger btn-sm"
                          onClick={() => eliminar(p.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-semibold">
                  {editando ? 'Editar producto' : 'Nuevo producto'}
                </h6>
                <button className="btn-close" onClick={cerrarModal} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small">Nombre</label>
                  <input className="form-control form-control-sm"
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Nombre del producto" />
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small">Precio ($)</label>
                    <input type="number" className="form-control form-control-sm"
                      value={form.precio} step="0.01"
                      onChange={e => setForm({ ...form, precio: e.target.value })} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">Stock</label>
                    <input type="number" className="form-control form-control-sm"
                      value={form.stock}
                      onChange={e => setForm({ ...form, stock: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label small">Categoría</label>
                  <select className="form-select form-select-sm"
                    value={form.categoria}
                    onChange={e => setForm({ ...form, categoria: Number(e.target.value) })}>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label small">Descripción</label>
                  <textarea className="form-control form-control-sm" rows={2}
                    value={form.descripcion}
                    onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary btn-sm"
                  onClick={cerrarModal}>Cancelar</button>
                <button className="btn btn-dark btn-sm"
                  onClick={guardar} disabled={guardando}>
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}