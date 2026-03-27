import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Sidebar />
      <main className="flex-grow-1 p-4" style={{ overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}