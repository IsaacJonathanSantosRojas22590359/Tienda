import { useEffect, useState } from 'react'
import { Search, Plus, Minus, Trash2, FileText } from 'lucide-react'
import cliente from '../api/cliente'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

interface Producto {
  id: number; nombre: string; precio: string; stock: number; categoria_nombre: string
}
interface ItemCarrito {
  producto: Producto; cantidad: number; subtotal: number
}

export default function Ventas() {
  const { usuario }                   = useAuth()
  const [productos,   setProductos]   = useState<Producto[]>([])
  const [busqueda,    setBusqueda]    = useState('')
  const [carrito,     setCarrito]     = useState<ItemCarrito[]>([])
  const [vendida,     setVendida]     = useState(false)
  const [ventaData,   setVentaData]   = useState<any>(null)
  const [loading,     setLoading]     = useState(true)
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    cliente.get('/productos/')
      .then(res => setProductos(res.data))
      .catch(()  => toast.error('Error al cargar productos'))
      .finally(() => setLoading(false))
  }, [])

  const filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const agregar = (producto: Producto) => {
    if (producto.stock === 0) { toast.error('Sin stock disponible'); return }
    setCarrito(prev => {
      const existe = prev.find(d => d.producto.id === producto.id)
      if (existe) {
        if (existe.cantidad >= producto.stock) {
          toast.error('Stock insuficiente'); return prev
        }
        return prev.map(d => d.producto.id === producto.id
          ? { ...d, cantidad: d.cantidad + 1, subtotal: (d.cantidad + 1) * Number(producto.precio) }
          : d)
      }
      return [...prev, { producto, cantidad: 1, subtotal: Number(producto.precio) }]
    })
  }

  const cambiarCantidad = (id: number, delta: number) => {
    setCarrito(prev =>
      prev.map(d => d.producto.id === id
        ? { ...d, cantidad: d.cantidad + delta, subtotal: (d.cantidad + delta) * Number(d.producto.precio) }
        : d
      ).filter(d => d.cantidad > 0)
    )
  }

  const total = carrito.reduce((s, d) => s + d.subtotal, 0)

  const confirmar = async () => {
    if (carrito.length === 0) { toast.error('Agrega al menos un producto'); return }
    setConfirmando(true)
    try {
      const res = await cliente.post('/ventas/', {
        usuario_id:  usuario?.id,
        metodo_pago: 'efectivo',
        detalles:    carrito.map(d => ({
          producto_id: d.producto.id,
          cantidad:    d.cantidad,
        }))
      })
      setVentaData(res.data)
      setVendida(true)
      toast.success('¡Venta registrada exitosamente!')
      // Recargar productos para actualizar stock
      const prodRes = await cliente.get('/productos/')
      setProductos(prodRes.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al registrar la venta')
    } finally {
      setConfirmando(false)
    }
  }

  const nuevaVenta = () => { setCarrito([]); setVendida(false); setVentaData(null) }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: 300 }}>
      <div className="spinner-border text-primary" />
    </div>
  )

  return (
    <div>
      <h4 className="fw-semibold mb-4">Registrar venta</h4>
      <div className="row g-3">
        {/* Lista de productos */}
        <div className="col-12 col-lg-7">
          <div className="card" style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
            <div className="card-body d-flex flex-column" style={{ overflow: 'hidden', padding: '1rem' }}>

              {/* Título y buscador */}
              <div style={{ flexShrink: 0 }}>
                <h6 className="fw-semibold mb-3">Productos disponibles</h6>
                <div className="input-group input-group-sm mb-3">
                  <span className="input-group-text"><Search size={14} /></span>
                  <input className="form-control" placeholder="Buscar producto..."
                    value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                </div>
              </div>

              {/* Lista con scroll */}
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                <div className="d-flex flex-column gap-2 pb-2">
                  {filtrados.map(p => (
                    <div key={p.id}
                      className="d-flex justify-content-between align-items-center p-2 border rounded"
                      style={{ opacity: p.stock === 0 ? 0.5 : 1 }}>
                      <div className="text-start">
                        <p className="mb-0 fw-medium text-start" style={{ fontSize: 13 }}>
                          {p.nombre}
                        </p>
                        <p className="mb-0 text-muted text-start" style={{ fontSize: 11 }}>
                          Stock: {p.stock} · {p.categoria_nombre}
                        </p>
                      </div>
                      <div className="d-flex align-items-center gap-2" style={{ flexShrink: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#7b9cff' }}>
                          ${Number(p.precio).toFixed(2)}
                        </span>
                        <button className="btn btn-dark btn-sm rounded-circle"
                          style={{ width: 28, height: 28, padding: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => agregar(p)}
                          disabled={p.stock === 0}>
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {filtrados.length === 0 && (
                    <p className="text-muted small text-center py-4">
                      No se encontraron productos
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Carrito */}
        <div className="col-12 col-lg-5">
          <div className="card" style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
            <div className="card-body d-flex flex-column" style={{ overflow: 'hidden', padding: '1rem' }}>

              {/* Título */}
              <h6 className="fw-semibold mb-3" style={{ flexShrink: 0 }}>
                Carrito
                <span className="badge-pastel-blue ms-2">
                  {carrito.reduce((s, d) => s + d.cantidad, 0)} items
                </span>
              </h6>

              {/* Lista de productos */}
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {carrito.length === 0 ? (
                  <p className="text-muted small text-center py-4">
                    Agrega productos desde la lista
                  </p>
                ) : (
                  <div className="d-flex flex-column gap-2 pb-2">
                    {carrito.map(d => (
                      <div key={d.producto.id}
                        className="d-flex align-items-center gap-2"
                        style={{ textAlign: 'left' }}>
                        <span className="flex-grow-1 text-start" style={{ fontSize: 13 }}>
                          {d.producto.nombre}
                        </span>
                        <div className="d-flex align-items-center gap-1">
                          <button className="btn btn-outline-secondary btn-sm p-0"
                            style={{ width: 22, height: 22, borderRadius: '50%' }}
                            onClick={() => cambiarCantidad(d.producto.id, -1)}>
                            <Minus size={11} />
                          </button>
                          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>
                            {d.cantidad}
                          </span>
                          <button className="btn btn-outline-secondary btn-sm p-0"
                            style={{ width: 22, height: 22, borderRadius: '50%' }}
                            onClick={() => cambiarCantidad(d.producto.id, 1)}>
                            <Plus size={11} />
                          </button>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 56, textAlign: 'right' }}>
                          ${d.subtotal.toFixed(2)}
                        </span>
                        <button className="btn btn-link btn-sm p-0 text-danger"
                          onClick={() => setCarrito(c => c.filter(x => x.producto.id !== d.producto.id))}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Parte inferior */}
              <div style={{ flexShrink: 0, borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <div className="d-flex justify-content-between mb-3"
                  style={{ fontSize: 16, fontWeight: 700 }}>
                  <span>Total</span>
                  <span style={{ color: '#7b9cff' }}>${total.toFixed(2)}</span>
                </div>

                {!vendida ? (
                  <button className="btn btn-dark w-100"
                    onClick={confirmar}
                    disabled={carrito.length === 0 || confirmando}>
                    {confirmando ? 'Registrando...' : 'Confirmar venta'}
                  </button>
                ) : ventaData && (
                  <>
                    {/* Ticket con scroll por si hay muchos productos insanos */}
                    <div style={{
                      background: '#f8faff', borderRadius: 10,
                      padding: 10, fontSize: 12, marginBottom: 10,
                      maxHeight: 220, overflowY: 'auto'
                    }}>
                      <div className="text-center mb-2">
                        <p className="fw-semibold mb-0" style={{ fontSize: 13 }}>
                          Tienda Familiar
                        </p>
                        <p className="text-muted mb-0">
                          Ticket #{ventaData.id} · {new Date(ventaData.fecha).toLocaleString('es-MX')}
                        </p>
                        <p className="text-muted mb-0">
                          Atendió: {ventaData.usuario_nombre}
                        </p>
                      </div>
                      <table className="table table-sm table-borderless mb-1"
                        style={{ fontSize: 11 }}>
                        <thead>
                          <tr>
                            <th className="text-start">Producto</th>
                            <th className="text-center">Cant.</th>
                            <th className="text-end">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ventaData.detalles.map((d: any) => (
                            <tr key={d.id}>
                              <td className="text-start">{d.producto_nombre}</td>
                              <td className="text-center">{d.cantidad}</td>
                              <td className="text-end">${Number(d.subtotal).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="d-flex justify-content-between fw-bold border-top pt-1">
                        <span>Total</span>
                        <span>${Number(ventaData.total).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-outline-danger btn-sm flex-grow-1"
                        onClick={() => {
                          const token = localStorage.getItem('access_token')
                          const url   = `${import.meta.env.VITE_API_URL}/ventas/${ventaData.id}/ticket/`
                          fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                            .then(res => res.blob())
                            .then(blob => {
                              const link    = document.createElement('a')
                              link.href     = URL.createObjectURL(blob)
                              link.download = `ticket_${ventaData.id}.pdf`
                              link.click()
                            })
                            .catch(() => toast.error('Error al generar el ticket'))
                        }}>
                        <FileText size={13} className="me-1" /> PDF
                      </button>
                      <button className="btn btn-outline-secondary btn-sm flex-grow-1"
                        onClick={nuevaVenta}>
                        Nueva venta
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}