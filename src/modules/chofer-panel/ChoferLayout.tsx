import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Map as MapIcon, ListChecks, UserCircle, LogOut } from 'lucide-react'

import { useDriverAuthStore } from '@/stores/driverAuthStore'

const NAV_ITEMS = [
  { path: '/chofer/mapa', icon: MapIcon, label: 'Ruta mapa' },
  { path: '/chofer/lista', icon: ListChecks, label: 'Ruta lista' },
  { path: '/chofer/perfil', icon: UserCircle, label: 'Perfil' },
]

export default function ChoferLayout() {
  const isAuthenticated = useDriverAuthStore((s) => s.isAuthenticated())
  const logout = useDriverAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/chofer/login" replace />
  }

  const handleLogout = () => {
    logout()
    navigate('/chofer/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border flex items-stretch h-16 z-20">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground"
        >
          <LogOut size={20} />
          Cerrar sesión
        </button>
      </nav>
    </div>
  )
}
