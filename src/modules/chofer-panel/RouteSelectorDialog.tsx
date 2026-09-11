import { useEffect, useState } from "react"
import { toast } from "sonner"
import { X, Loader2, CheckCircle2, MapPin } from "lucide-react"

import { getMyRoutes, DriverRouteDTO } from "@/Fetch/driverPanel"
import { useDriverRouteSelection } from "@/stores/driverRouteSelection"

interface RouteSelectorDialogProps {
  open: boolean
  onClose: () => void
}

export default function RouteSelectorDialog({ open, onClose }: RouteSelectorDialogProps) {
  const [routes, setRoutes] = useState<DriverRouteDTO[]>([])
  const [loading, setLoading] = useState(true)
  const selectedRouteId = useDriverRouteSelection((s) => s.selectedRouteId)
  const setSelectedRouteId = useDriverRouteSelection((s) => s.setSelectedRouteId)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getMyRoutes()
      .then((res) => {
        const today = new Date().toISOString().slice(0, 10)
        setRoutes(res.data.filter((r) => r.route_date.slice(0, 10) === today))
      })
      .catch(() => toast.error("Error al cargar tus rutas"))
      .finally(() => setLoading(false))
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[75vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-white">
          <h2 className="font-bold text-foreground">Tus rutas de hoy</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <div className="p-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
          ) : routes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tienes rutas asignadas para hoy.</p>
          ) : (
            routes.map((route, index) => {
              const selected = selectedRouteId === route.id_route
              return (
                <button
                  key={route.id_route}
                  onClick={() => {
                    setSelectedRouteId(route.id_route)
                    onClose()
                  }}
                  className={`w-full text-left flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${
                    selected ? "bg-primary/10 border-primary/30" : "bg-white border-border hover:border-input"
                  }`}
                >
                  <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{route.route_template?.name ?? `Ruta ${index + 1}`}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin size={11} /> {route.stops.length} tienda{route.stops.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {route.is_finished && (
                    <span className="flex items-center gap-1 text-xs text-success shrink-0">
                      <CheckCircle2 size={14} /> Finalizada
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
