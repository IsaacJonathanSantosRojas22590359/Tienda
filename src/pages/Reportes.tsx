import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FileText, FileSpreadsheet } from 'lucide-react'

const ventasDiarias = [
  { dia: 'Lun', ventas: 8 }, { dia: 'Mar', ventas: 14 }, { dia: 'Mié', ventas: 11 },
  { dia: 'Jue', ventas: 18 }, { dia: 'Vie', ventas: 16 }, { dia: 'Sáb', ventas: 22 },
]
const ventasSemanales = [
  { semana: 'Sem 1', ingresos: 9800 }, { semana: 'Sem 2', ingresos: 12400 },
  { semana: 'Sem 3', ingresos: 14200 }, { semana: 'Sem 4', ingresos: 11920 },
]
const topProductos = [
  { nombre: 'Coca-Cola 600ml',    unidades: 312, ingresos: 5616 },
  { nombre: 'Sabritas 45g',       unidades: 248, ingresos: 4092 },
  { nombre: 'Agua mineral 1L',    unidades: 210, ingresos: 2520 },
  { nombre: 'Pan Bimbo blanco',   unidades: 185, ingresos: 8325 },
  { nombre: 'Leche Lala 1L',      unidades: 170, ingresos: 4760 },
]

export default function Reportes() {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-semibold mb-0">Reportes</h4>
          <p className="text-muted small mb-0">Análisis de ventas e inventario</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2">
            <FileText size={14} /> Exportar PDF
          </button>
          <button className="btn btn-outline-success btn-sm d-flex align-items-center gap-2">
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
                style={{ width: 160 }} defaultValue="2026-03-01" />
            </div>
            <div className="col-auto">
              <label className="form-label small mb-0 me-2">Hasta</label>
              <input type="date" className="form-control form-control-sm d-inline-block"
                style={{ width: 160 }} defaultValue="2026-03-20" />
            </div>
            <div className="col-auto">
              <select className="form-select form-select-sm" style={{ width: 180 }}>
                <option>Todos los empleados</option>
                <option>María López</option>
                <option>Juan Torres</option>
              </select>
            </div>
            <div className="col-auto">
              <button className="btn btn-dark btn-sm">Aplicar</button>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total ingresos', valor: '$48,320' },
          { label: 'Total ventas',   valor: '184' },
          { label: 'Promedio/venta', valor: '$262.61' },
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
              <h6 className="fw-semibold mb-3">Ventas por día de la semana</h6>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ventasDiarias}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="ventas" fill="#0d6efd" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card">
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Ingresos por semana</h6>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={ventasSemanales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                  <Line type="monotone" dataKey="ingresos" stroke="#198754"
                    strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla top productos */}
      <div className="card">
        <div className="card-body">
          <h6 className="fw-semibold mb-3">Productos más vendidos</h6>
          <div className="table-responsive">
            <table className="table table-hover table-sm align-middle mb-0">
              <thead className="table-light">
                <tr><th>#</th><th>Producto</th><th>Unidades</th><th>Ingresos</th></tr>
              </thead>
              <tbody>
                {topProductos.map((p, i) => (
                  <tr key={i}>
                    <td>
                      <span className={`badge ${i < 3 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="fw-medium">{p.nombre}</td>
                    <td>{p.unidades}</td>
                    <td>${p.ingresos.toLocaleString()}</td>
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