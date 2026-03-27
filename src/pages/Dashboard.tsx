import { BarChart2, ShoppingCart, Package, Users } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const ventasDiarias = [
  { dia: '1', ventas: 8 }, { dia: '5', ventas: 14 }, { dia: '10', ventas: 11 },
  { dia: '15', ventas: 18 }, { dia: '20', ventas: 16 },
]

const topProductos = [
  { nombre: 'Coca-Cola 600ml', unidades: 88 },
  { nombre: 'Sabritas orig.',  unidades: 72 },
  { nombre: 'Agua 1L',         unidades: 65 },
  { nombre: 'Pan Bimbo',       unidades: 54 },
]

const ultimasVentas = [
  { id: 184, empleado: 'Isaac Santos',  total: 127.50, fecha: 'Hoy 14:32' },
  { id: 183, empleado: 'Juan Torres',  total: 28.00,  fecha: 'Hoy 13:15' },
  { id: 182, empleado: 'Isaac Santos',  total: 340.00, fecha: 'Hoy 11:50' },
  { id: 181, empleado: 'Carlos Ríos',  total: 89.00,  fecha: 'Ayer 18:40' },
]

export default function Dashboard() {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-semibold mb-0">Dashboard</h4>
          <p className="text-muted small mb-0">Resumen general del negocio</p>
        </div>
        <div className="btn-group btn-group-sm">
          <button className="btn btn-outline-secondary">Hoy</button>
          <button className="btn btn-dark">Este mes</button>
          <button className="btn btn-outline-secondary">Este año</button>
        </div>
      </div>

      {/* Tarjetas de métricas */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Ingresos del mes', valor: '$48,320', delta: '+12% vs anterior', icono: <BarChart2 size={18} />, color: 'primary' },
          { label: 'Ventas realizadas', valor: '184', delta: '+8 esta semana', icono: <ShoppingCart size={18} />, color: 'success' },
          { label: 'Productos en stock', valor: '312', delta: '4 con stock bajo', icono: <Package size={18} />, color: 'warning' },
          { label: 'Empleados activos', valor: '6', delta: 'Sin cambios', icono: <Users size={18} />, color: 'info' },
        ].map((c, i) => (
          <div key={i} className="col-6 col-xl-3">
            <div className="card h-100">
              <div className="card-body">
                <div className={`text-${c.color} mb-2`}>{c.icono}</div>
                <p className="text-muted small mb-1">{c.label}</p>
                <h4 className="fw-semibold mb-1">{c.valor}</h4>
                <p className="text-muted small mb-0">{c.delta}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 mb-4">
        {/* Gráfica de ventas */}
        <div className="col-12 col-lg-7">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Ventas diarias — este mes</h6>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={ventasDiarias}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="ventas" stroke="#0d6efd" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top productos */}
        <div className="col-12 col-lg-5">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Productos más vendidos</h6>
              {topProductos.map((p, i) => (
                <div key={i} className="mb-2">
                  <div className="d-flex justify-content-between small mb-1">
                    <span>{p.nombre}</span>
                    <span className="text-muted">{p.unidades}</span>
                  </div>
                  <div className="progress" style={{ height: 6 }}>
                    <div className="progress-bar bg-primary"
                      style={{ width: `${(p.unidades / 88) * 100}%` }} />
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
                <tr>
                  <th>#</th><th>Empleado</th><th>Total</th><th>Fecha</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {ultimasVentas.map(v => (
                  <tr key={v.id}>
                    <td className="text-muted small">#{v.id}</td>
                    <td>{v.empleado}</td>
                    <td className="fw-medium">${v.total.toFixed(2)}</td>
                    <td className="text-muted small">{v.fecha}</td>
                    <td><span className="badge bg-success-subtle text-success">Completada</span></td>
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