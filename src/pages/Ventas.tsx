import { useState } from 'react'
import { Search, Plus, Minus, Trash2, FileText } from 'lucide-react'
import type { Producto, DetalleVenta } from '../types'
import toast from 'react-hot-toast'

const productosDemo: Producto[] = [
  { id: 1, nombre: 'Coca-Cola 600ml',    precio: 18,   stock: 142, descripcion: '', categoria: 'Bebidas',   activo: true },
  { id: 2, nombre: 'Sabritas orig. 45g', precio: 16.5, stock: 68,  descripcion: '', categoria: 'Botanas',   activo: true },
  { id: 3, nombre: 'Agua mineral 1L',    precio: 12,   stock: 95,  descripcion: '', categoria: 'Bebidas',   activo: true },
  { id: 4, nombre: 'Pan Bimbo blanco',   precio: 45,   stock: 34,  descripcion: '', categoria: 'Abarrotes', activo: true },
  { id: 5, nombre: 'Leche Lala 1L',      precio: 28,   stock: 22,  descripcion: '', categoria: 'Lácteos',   activo: true },
]

export default function Ventas() {
  const [busqueda, setBusqueda] = useState('')
  const [carrito, setCarrito]   = useState<DetalleVenta[]>([])
  const [vendida, setVendida]   = useState(false)

  const productosFiltrados = productosDemo.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const agregar = (producto: Producto) => {
    setCarrito(prev => {
      const existe = prev.find(d => d.producto.id === producto.id)
      if (existe) {
        return prev.map(d => d.producto.id === producto.id
          ? { ...d, cantidad: d.cantidad + 1, subtotal: (d.cantidad + 1) * d.producto.precio }
          : d)
      }
      return [...prev, { producto, cantidad: 1, subtotal: producto.precio }]
    })
  }

  const cambiarCantidad = (id: number, delta: number) => {
    setCarrito(prev => prev
      .map(d => d.producto.id === id
        ? { ...d, cantidad: d.cantidad + delta, subtotal: (d.cantidad + delta) * d.producto.precio }
        : d)
      .filter(d => d.cantidad > 0)
    )
  }

  const total = carrito.reduce((s, d) => s + d.subtotal, 0)

  const confirmar = () => {
    if (carrito.length === 0) return
    setVendida(true)
    toast.success('¡Venta registrada exitosamente!')
  }

  const nuevaVenta = () => { setCarrito([]); setVendida(false) }

  return (
    <div>
      <h4 className="fw-semibold mb-4">Registrar venta</h4>
      <div className="row g-3">

        {/* Panel izquierdo: productos */}
        <div className="col-12 col-lg-7">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Seleccionar productos</h6>
              <div className="input-group input-group-sm mb-3">
                <span className="input-group-text"><Search size={14} /></span>
                <input className="form-control" placeholder="Buscar producto..."
                  value={busqueda} onChange={e => setBusqueda(e.target.value)} />
              </div>
              <div className="d-flex flex-column gap-2">
                {productosFiltrados.map(p => (
                  <div key={p.id}
                    className="d-flex justify-content-between align-items-center p-2 border rounded">
                    <div>
                      <p className="mb-0 fw-medium small">{p.nombre}</p>
                      <p className="mb-0 text-muted" style={{ fontSize: 11 }}>
                        Stock: {p.stock} · {p.categoria}
                      </p>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-primary fw-medium small">${p.precio.toFixed(2)}</span>
                      <button className="btn btn-sm btn-outline-primary rounded-circle"
                        style={{ width: 26, height: 26, padding: 0 }}
                        onClick={() => agregar(p)}>
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho: carrito y ticket */}
        <div className="col-12 col-lg-5">
          <div className="card h-100">
            <div className="card-body d-flex flex-column">
              <h6 className="fw-semibold mb-3">Carrito</h6>

              {carrito.length === 0 ? (
                <p className="text-muted small text-center py-3">
                  Agrega productos desde la lista
                </p>
              ) : (
                <div className="d-flex flex-column gap-2 mb-3">
                  {carrito.map(d => (
                    <div key={d.producto.id}
                      className="d-flex align-items-center gap-2">
                      <span className="flex-grow-1 small">{d.producto.nombre}</span>
                      <div className="d-flex align-items-center gap-1">
                        <button className="btn btn-outline-secondary btn-sm p-0"
                          style={{ width: 22, height: 22 }}
                          onClick={() => cambiarCantidad(d.producto.id, -1)}>
                          <Minus size={11} />
                        </button>
                        <span className="small fw-medium" style={{ minWidth: 20, textAlign: 'center' }}>
                          {d.cantidad}
                        </span>
                        <button className="btn btn-outline-secondary btn-sm p-0"
                          style={{ width: 22, height: 22 }}
                          onClick={() => cambiarCantidad(d.producto.id, 1)}>
                          <Plus size={11} />
                        </button>
                      </div>
                      <span className="small fw-medium" style={{ minWidth: 52, textAlign: 'right' }}>
                        ${d.subtotal.toFixed(2)}
                      </span>
                      <button className="btn btn-link btn-sm text-danger p-0"
                        onClick={() => setCarrito(c => c.filter(x => x.producto.id !== d.producto.id))}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-top pt-3 mt-auto">
                <div className="d-flex justify-content-between fw-semibold mb-3">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                {!vendida ? (
                  <button className="btn btn-dark w-100 btn-sm"
                    onClick={confirmar} disabled={carrito.length === 0}>
                    Confirmar venta
                  </button>
                ) : (
                  <div>
                    {/* Ticket */}
                    <div className="bg-light rounded p-3 mb-3" style={{ fontSize: 12 }}>
                      <div className="text-center mb-2">
                        <p className="fw-semibold mb-0">Tienda Familiar</p>
                        <p className="text-muted mb-0">
                          Ticket #{Math.floor(Math.random() * 900) + 100} · {new Date().toLocaleString('es-MX')}
                        </p>
                      </div>
                      <table className="table table-sm table-borderless mb-1" style={{ fontSize: 12 }}>
                        <thead><tr>
                          <th>Producto</th><th className="text-center">Cant.</th>
                          <th className="text-end">Subtotal</th>
                        </tr></thead>
                        <tbody>
                          {carrito.map(d => (
                            <tr key={d.producto.id}>
                              <td>{d.producto.nombre}</td>
                              <td className="text-center">{d.cantidad}</td>
                              <td className="text-end">${d.subtotal.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="d-flex justify-content-between fw-semibold border-top pt-1">
                        <span>Total</span><span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-danger btn-sm flex-grow-1">
                        <FileText size={13} className="me-1" />Descargar PDF
                      </button>
                      <button className="btn btn-outline-secondary btn-sm flex-grow-1"
                        onClick={nuevaVenta}>
                        Nueva venta
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 