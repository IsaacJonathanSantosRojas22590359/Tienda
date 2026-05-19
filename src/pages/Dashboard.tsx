import { useEffect, useState } from 'react'
import { BarChart2, ShoppingCart, Package, Users } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import cliente from '../api/cliente'
import toast from 'react-hot-toast'

interface DashboardData {
  ingresos_mes:   number
  ventas_mes:     number
  total_stock:    number
  stock_bajo:     number
  empleados:      number
  ultimas_ventas: any[]
  top_productos:  any[]
}

export default function Dashboard() {
  const [data,    setData]    = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cliente.get('/reportes/dashboard/')
      .then(res => setData(res.data))
      .catch(()  => toast.error('Error al cargar el dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: 300 }}>
      <div className="spinner-border text-primary" />
    </div>
  )

  if (!data) return null

  const metricas = [
    { label: 'Ingresos del mes',   valor: `$${data.ingresos_mes.toLocaleString()}`, icono: <BarChart2 size={20} />, cls: 'metric-card-blue',   iconColor: '#1d4ed8' },
    { label: 'Ventas realizadas',  valor: data.ventas_mes,                           icono: <ShoppingCart size={20} />, cls: 'metric-card-green',  iconColor: '#15803d' },
    { label: 'Productos en stock', valor: data.total_stock,                           icono: <Package size={20} />,      cls: 'metric-card-yellow', iconColor: '#a16207',
      extra: data.stock_bajo > 0 ? `⚠ ${data.stock_bajo} con stock bajo` : 'Todo en orden' },
    { label: 'Empleados activos',  valor: data.empleados,                             icono: <Users size={20} />,        cls: 'metric-card-purple', iconColor: '#7c3aed' },
  ]

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-semibold mb-0">Dashboard</h4>
          <p className="text-muted small mb-0">Resumen general del negocio</p>
        </div>
      </div>

      {/* Métricas */}
      <div className="row g-3 mb-4">
        {metricas.map((c, i) => (
          <div key={i} className="col-6 col-xl-3">
            <div className={`card h-100 ${c.cls}`}>
              <div className="card-body">
                <div style={{ color: c.iconColor }} className="mb-2">{c.icono}</div>
                <p className="mb-1" style={{ fontSize: 12, color: '#64748b' }}>{c.label}</p>
                <h4 className="fw-semibold mb-1" style={{ color: '#1e293b' }}>{c.valor}</h4>
                {c.extra && <p className="mb-0" style={{ fontSize: 12, color: '#64748b' }}>{c.extra}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 mb-4">
        {/* Gráfica top productos */}
        <div className="col-12 col-lg-7">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Productos más vendidos</h6>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.top_productos}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="unidades"
                    stroke="#0d6efd" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top productos barra */}
        <div className="col-12 col-lg-5">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Unidades vendidas</h6>
              {data.top_productos.map((p: any, i: number) => (
                <div key={i} className="mb-2">
                  <div className="d-flex justify-content-between small mb-1">
                    <span>{p.nombre}</span>
                    <span className="text-muted">{p.unidades}</span>
                  </div>
                  <div className="progress" style={{ height: 6 }}>
                    <div className="progress-bar bg-primary"
                      style={{ width: `${(p.unidades / data.top_productos[0].unidades) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Últimas ventas */}
      <div className="card">
        <div className="card-body">
          <h6 className="fw-semibold mb-3">Últimas ventas registradas</h6>
          <div className="table-responsive">
            <table className="table table-hover table-sm align-middle mb-0">
              <thead className="table-light">
                <tr><th>#</th><th>Empleado</th><th>Total</th><th>Fecha</th><th>Método</th></tr>
              </thead>
              <tbody>
                {data.ultimas_ventas.map((v: any) => (
                  <tr key={v.id}>
                    <td className="text-muted small">#{v.id}</td>
                    <td>{v.empleado}</td>
                    <td className="fw-medium">${Number(v.total).toFixed(2)}</td>
                    <td className="text-muted small">
                      {new Date(v.fecha).toLocaleString('es-MX')}
                    </td>
                    <td><span className="badge-pastel-green">{v.metodo_pago}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}