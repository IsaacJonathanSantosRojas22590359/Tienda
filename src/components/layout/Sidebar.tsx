import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart,
  Users, BarChart2, LogOut
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const links = [
  { to: '/dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard',  soloAdmin: true  },
  { to: '/productos',  icon: <Package size={16} />,         label: 'Productos',  soloAdmin: true  },
  { to: '/ventas',     icon: <ShoppingCart size={16} />,    label: 'Ventas',     soloAdmin: false },
  { to: '/empleados',  icon: <Users size={16} />,           label: 'Empleados',  soloAdmin: true  },
  { to: '/reportes',   icon: <BarChart2 size={16} />,       label: 'Reportes',   soloAdmin: true  },
]

export default function Sidebar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }

  const visibles = links.filter(l => !l.soloAdmin || usuario?.rol === 'admin')

  return (
    <div className="d-flex flex-column bg-dark text-white"
      style={{ width: 220, minHeight: '100vh', padding: '1.5rem 1rem' }}>

      <div className="mb-4 px-2">
        <p className="fw-semibold mb-0" style={{ fontSize: 15 }}>Sistema Tienda</p>
        <p className="text-secondary mb-0" style={{ fontSize: 12 }}>
          {usuario?.nombre} · <span className="text-capitalize">{usuario?.rol}</span>
        </p>
      </div>

      <nav className="d-flex flex-column gap-1 flex-grow-1">
        {visibles.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `d-flex align-items-center gap-2 px-3 py-2 rounded text-decoration-none
               ${isActive ? 'bg-primary text-white' : 'text-secondary'}`
            }
            style={{ fontSize: 14 }}
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </nav>

      <button onClick={handleLogout}
        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 mt-3">
        <LogOut size={14} /> Cerrar sesión
      </button>
    </div>
  )
}