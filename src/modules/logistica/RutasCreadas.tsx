import { toast } from "sonner"
import { useEffect, useMemo, useState } from "react"
import { Loader2, Truck, Calendar, Store as StoreIcon, Search, Pencil, Trash2, Repeat } from "lucide-react"

import {
  Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label, Button, Checkbox,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components"
import { getRoutesByClient, setRouteActive, updateRoute, deleteRoute, RouteDTO } from "@/Fetch/delivery-routes"
import { getDrivers, DriverDTO } from "@/Fetch/drivers"
import { StoreDTO } from "@/dtos"
import { api, ApiResponse } from "@/lib"
import { DIAS_SEMANA, INTERVALOS_SEMANAS } from "@/Fetch/routeSchedules"

export default function RutasCreadas() {
  const [routes, setRoutes] = useState<RouteDTO[]>([])
  const [drivers, setDrivers] = useState<DriverDTO[]>([])
  const [stores, setStores] = useState<StoreDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"todas" | "activas" | "desactivadas">("todas")
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const [editing, setEditing] = useState<RouteDTO | null>(null)
  const [editDriverId, setEditDriverId] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editStoreIds, setEditStoreIds] = useState<number[]>([])
  const [editStoreSearch, setEditStoreSearch] = useState("")
  const [saving, setSaving] = useState(false)

  const [toDelete, setToDelete] = useState<RouteDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchRoutes = () => {
    setLoading(true)
    getRoutesByClient()
      .then((res) => setRoutes(res.data ?? []))
      .catch(() => toast.error("Error al cargar las rutas"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRoutes()
    getDrivers().then((res) => setDrivers(res.data ?? [])).catch(() => {})
    api.get<ApiResponse<StoreDTO[]>>('/stores/').then((res) => setStores(res.data ?? [])).catch(() => {})
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

  const openEdit = (route: RouteDTO) => {
    setEditing(route)
    setEditDriverId(String(route.id_driver))
    setEditDate(route.route_date.slice(0, 10))
    setEditStoreIds(route.stops.map((s) => s.id_store))
    setEditStoreSearch("")
  }

  const toggleEditStore = (id_store: number) => {
    setEditStoreIds((prev) => (prev.includes(id_store) ? prev.filter((s) => s !== id_store) : [...prev, id_store]))
  }

  const filteredEditStores = useMemo(
    () => stores.filter((s) => s.name.toLowerCase().includes(editStoreSearch.toLowerCase())),
    [stores, editStoreSearch]
  )

  const handleSaveEdit = async () => {
    if (!editing) return
    if (!editDriverId || !editDate) {
      toast.error("Selecciona chofer y fecha")
      return
    }
    if (editStoreIds.length === 0) {
      toast.error("Selecciona al menos una tienda")
      return
    }
    setSaving(true)
    try {
      await updateRoute(editing.id_route, {
        id_driver: Number(editDriverId),
        route_date: editDate,
        stops: editStoreIds.map((id_store) => ({ id_store })),
      })
      toast.success("Ruta actualizada")
      setEditing(null)
      fetchRoutes()
    } catch (e: any) {
      toast.error(e?.message || "Error al actualizar la ruta")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteRoute(toDelete.id_route)
      toast.success("Ruta eliminada")
      setToDelete(null)
      fetchRoutes()
    } catch (e: any) {
      toast.error(e?.message || "Error al eliminar la ruta")
    } finally {
      setDeleting(false)
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

  const describeRecurrence = (route: RouteDTO) => {
    if (!route.schedule) return null
    const dia = DIAS_SEMANA.find((d) => d.value === route.schedule!.day_of_week)?.label ?? ""
    const intervalo = INTERVALOS_SEMANAS.find((i) => i.value === route.schedule!.interval_weeks)?.label ?? ""
    return `Todos los ${dia} · ${intervalo}`
  }

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
                  <div>
                    {route.route_template?.name && (
                      <p className="text-xs text-muted-foreground leading-none mb-0.5">{route.route_template.name}</p>
                    )}
                    <h3 className="font-bold text-foreground">{route.driver.name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {updatingId === route.id_route && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
                  <button
                    onClick={() => handleToggle(route)}
                    disabled={updatingId === route.id_route}
                    className={`relative w-10 h-5.5 rounded-full transition-colors ${route.is_active ? "bg-success" : "bg-muted"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${route.is_active ? "translate-x-4" : ""}`} />
                  </button>
                  <button onClick={() => openEdit(route)} className="p-1.5 rounded-lg hover:bg-muted">
                    <Pencil size={14} className="text-muted-foreground" />
                  </button>
                  <button onClick={() => setToDelete(route)} className="p-1.5 rounded-lg hover:bg-destructive/10">
                    <Trash2 size={14} className="text-destructive" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Calendar size={14} /> {new Date(route.route_date.slice(0, 10) + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <StoreIcon size={14} /> {route.stops.length} tienda{route.stops.length !== 1 ? "s" : ""}
              </p>
              {route.schedule && (
                <p className="text-sm text-info flex items-center gap-1.5">
                  <Repeat size={14} /> {describeRecurrence(route)}
                </p>
              )}
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${route.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                {route.is_active ? "Activa" : "Desactivada"}
              </span>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar ruta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Chofer</Label>
              <Select value={editDriverId} onValueChange={setEditDriverId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d.id_driver} value={String(d.id_driver)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
            <div>
              <Label>Tiendas ({editStoreIds.length} seleccionadas)</Label>
              <div className="relative mt-1 mb-2">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <Input value={editStoreSearch} onChange={(e) => setEditStoreSearch(e.target.value)} placeholder="Buscar tienda..." className="pl-8" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 border border-border rounded-lg p-2">
                {filteredEditStores.map((s) => (
                  <div
                    key={s.id_store}
                    onClick={() => toggleEditStore(s.id_store)}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      editStoreIds.includes(s.id_store) ? "bg-info/10 border-info/30" : "bg-white border-border hover:border-input"
                    }`}
                  >
                    <Checkbox checked={editStoreIds.includes(s.id_store)} className="pointer-events-none" />
                    <span className="text-sm truncate">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar esta ruta</AlertDialogTitle>
            <AlertDialogDescription>
              Se va a borrar por completo esta ruta organizada (chofer {toDelete?.driver.name}, {toDelete && new Date(toDelete.route_date.slice(0, 10) + "T00:00:00").toLocaleDateString("es-MX")}). Esto no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={deleting}>
              {deleting && <Loader2 size={14} className="mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
