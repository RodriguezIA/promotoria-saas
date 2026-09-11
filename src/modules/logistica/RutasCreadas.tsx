import { toast } from "sonner"
import { useEffect, useMemo, useState } from "react"
import { Loader2, Truck, Calendar, Store, Search } from "lucide-react"

import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components"
import { getRoutesByClient, setRouteActive, RouteDTO } from "@/Fetch/delivery-routes"

export default function RutasCreadas() {
  const [routes, setRoutes] = useState<RouteDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"todas" | "activas" | "desactivadas">("todas")
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const fetchRoutes = () => {
    setLoading(true)
    getRoutesByClient()
      .then((res) => setRoutes(res.data ?? []))
      .catch(() => toast.error("Error al cargar las rutas"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRoutes()
  }, [])

  const handleToggle = async (route: RouteDTO) => {
    setUpdatingId(route.id_route)
    try {
      await setRouteActive(route.id_route, !route.is_active)
      setRoutes((prev) => prev.map((r) => (r.id_route === route.id_route ? { ...r, is_active: !r.is_active } : r)))
    } catch (e: any) {
      toast.error(e?.message || "Error al actualizar la ruta")
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      if (statusFilter === "activas" && !r.is_active) return false
      if (statusFilter === "desactivadas" && r.is_active) return false
      if (search && !r.driver.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [routes, statusFilter, search])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por chofer..." className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="activas">Activas</SelectItem>
            <SelectItem value="desactivadas">Desactivadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {routes.length === 0 ? "Todavía no has organizado ninguna ruta." : "Ninguna ruta coincide con estos filtros."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoutes.map((route) => (
            <div key={route.id_route} className={`rounded-xl border bg-white p-5 space-y-3 ${route.is_active ? "border-border" : "border-border opacity-60"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-muted-foreground" />
                  <h3 className="font-bold text-foreground">{route.driver.name}</h3>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {updatingId === route.id_route && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
                  <button
                    onClick={() => handleToggle(route)}
                    disabled={updatingId === route.id_route}
                    className={`relative w-10 h-5.5 rounded-full transition-colors ${route.is_active ? "bg-success" : "bg-muted"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${route.is_active ? "translate-x-4" : ""}`} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Calendar size={14} /> {new Date(route.route_date + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Store size={14} /> {route.stops.length} tienda{route.stops.length !== 1 ? "s" : ""}
              </p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${route.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                {route.is_active ? "Activa" : "Desactivada"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
