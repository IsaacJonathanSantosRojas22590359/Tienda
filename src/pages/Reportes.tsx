import { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { FileText, FileSpreadsheet } from 'lucide-react'
import cliente from '../api/cliente'
import toast from 'react-hot-toast'

export default function Reportes() {
  const hoy    = new Date().toISOString().split('T')[0]
  const inicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0]

  const [desde,       setDesde]       = useState(inicio)
  const [hasta,       setHasta]       = useState(hoy)
  const [porDia,      setPorDia]      = useState<any[]>([])
  const [porMes,      setPorMes]      = useState<any[]>([])
  const [topProds,    setTopProds]    = useState<any[]>([])
  const [resumen,     setResumen]     = useState({ total: 0, ventas: 0, promedio: 0 })
  const [loading,     setLoading]     = useState(true)

  const cargar = () => {
    setLoading(true)
    Promise.all([
      cliente.get(`/reportes/ventas-por-dia/?desde=${desde}&hasta=${hasta}`),
      cliente.get('/reportes/ventas-por-mes/'),
      cliente.get('/reportes/top-productos/?limite=5'),
    ]).then(([diaRes, mesRes, topRes]) => {
      setPorDia(diaRes.data)
      setPorMes(mesRes.data)
      setTopProds(topRes.data)
      const total   = diaRes.data.reduce((s: number, d: any) => s + d.ingresos, 0)
      const ventas  = diaRes.data.reduce((s: number, d: any) => s + d.total_ventas, 0)
      setResumen({ total, ventas, promedio: ventas > 0 ? total / ventas : 0 })
    }).catch(() => toast.error('Error al cargar reportes'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-semibold mb-0">Reportes</h4>
          <p className="text-muted small mb-0">Análisis de ventas e inventario</p>
        </div>
      <div className="d-flex gap-2">
        <button
          className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2"
            onClick={() => {
              const token = localStorage.getItem('access_token')
              const url   = `${import.meta.env.VITE_API_URL}/reportes/exportar/pdf/?desde=${desde}&hasta=${hasta}`
              fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => res.blob())
                .then(blob => {
                  const link  = document.createElement('a')
                  link.href   = URL.createObjectURL(blob)
                  link.download = `reporte_${desde}_${hasta}.pdf`
                  link.click()
                })
            }}>
            <FileText size={14} /> Exportar PDF
          </button>

          <button
            className="btn btn-outline-success btn-sm d-flex align-items-center gap-2"
            onClick={() => {
              const token = localStorage.getItem('access_token')
              const url   = `${import.meta.env.VITE_API_URL}/reportes/exportar/excel/?desde=${desde}&hasta=${hasta}`
              fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => res.blob())
                .then(blob => {
                  const link  = document.createElement('a')
                  link.href   = URL.createObjectURL(blob)
                  link.download = `reporte_${desde}_${hasta}.xlsx`
                  link.click()
                })
            }}>
            <FileSpreadsheet size={14} /> Exportar Excel
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body py-2">
          <div className="row g-2 align-items-center">
            <div className="col-auto">
              <label className="form-label small mb-0 me-2">Desde</label>
              <input type="date" className="form-control form-control-sm d-inline-block"
                style={{ width: 160 }} value={desde}
                onChange={e => setDesde(e.target.value)} />
            </div>
            <div className="col-auto">
              <label className="form-label small mb-0 me-2">Hasta</label>
              <input type="date" className="form-control form-control-sm d-inline-block"
                style={{ width: 160 }} value={hasta}
                onChange={e => setHasta(e.target.value)} />
            </div>
            <div className="col-auto">
              <button className="btn btn-dark btn-sm" onClick={cargar}>
                Aplicar
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center" style={{ height: 200 }}>
          <div className="spinner-border text-primary mt-5" />
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div className="row g-3 mb-4">
            {[
              { label: 'Total ingresos',  valor: `$${resumen.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
              { label: 'Total ventas',    valor: resumen.ventas },
              { label: 'Promedio/venta',  valor: `$${resumen.promedio.toFixed(2)}` },
            ].map((c, i) => (
              <div key={i} className="col-12 col-md-4">
                <div className="card">
                  <div className="card-body">
                    <p className="text-muted small mb-1">{c.label}</p>
                    <h4 className="fw-semibold mb-0">{c.valor}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Gráficas */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-lg-6">
              <div className="card">
                <div className="card-body">
                  <h6 className="fw-semibold mb-3">Ventas por día</h6>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={porDia}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="total_ventas" fill="#0d6efd" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="card">
                <div className="card-body">
                  <h6 className="fw-semibold mb-3">Ingresos por mes</h6>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={porMes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }}
                        tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
                      <Line type="monotone" dataKey="ingresos"
                        stroke="#198754" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Top productos */}
          <div className="card">
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Productos más vendidos</h6>
              <div className="table-responsive">
                <table className="table table-hover table-sm align-middle mb-0">
                  <thead className="table-light">
                    <tr><th>#</th><th>Producto</th><th>Categoría</th><th>Unidades</th><th>Ingresos</th></tr>
                  </thead>
                  <tbody>
                    {topProds.map((p, i) => (
                      <tr key={i}>
                        <td>
                          <span className={`badge ${i < 3 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="fw-medium">{p.nombre}</td>
                        <td>{p.categoria}</td>
                        <td>{p.unidades}</td>
                        <td>${Number(p.ingresos).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}