import { toast } from "sonner"
import { useEffect, useMemo, useState } from "react"
import { GoogleMap } from '@react-google-maps/api'
import { Route as RouteIcon, Plus, Pencil, Trash2, Loader2, Store, Search, ArrowLeft, TrendingUp, AlertTriangle, Info, X } from "lucide-react"

import { useAuthStore } from "@/stores"
import { useJsApiLoader, GOOGLE_MAPS_CONFIG } from "@/lib"
import { MapStoreDTO } from "@/dtos"
import { getStockMapData } from "@/Fetch/stock"
import {
  PageWrapper, PageHeader, Button, Input, Label, Checkbox, Badge,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components"
import {
  getRouteTemplates, createRouteTemplate, updateRouteTemplate, deleteRouteTemplate, estimateRouteSales,
  RouteTemplateDTO, RouteSalesEstimateDTO, DIAS_SEMANA, INTERVALOS_SEMANAS, describeRecurrence,
} from "@/Fetch/routeTemplates"
import { StoreMarker } from "@/modules/mapa/components/StoreMarker"

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' }
const DEFAULT_CENTER = { lat: 25.7460, lng: -100.2792 }

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value)

export default function CrearRuta() {
  const { user } = useAuthStore()
  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_CONFIG)

  const [templates, setTemplates] = useState<RouteTemplateDTO[]>([])
  const [stores, setStores] = useState<MapStoreDTO[]>([])
  const [loading, setLoading] = useState(true)

  const [building, setBuilding] = useState(false)
  const [editing, setEditing] = useState<RouteTemplateDTO | null>(null)
  const [name, setName] = useState("")
  const [recurrenceType, setRecurrenceType] = useState<"SEMANAL" | "FECHAS">("SEMANAL")
  const [dayOfWeek, setDayOfWeek] = useState<number>(1)
  const [intervalWeeks, setIntervalWeeks] = useState<number>(1)
  const [specificDates, setSpecificDates] = useState<string[]>([])
  const [dateInput, setDateInput] = useState("")
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([])
  const [storeSearch, setStoreSearch] = useState("")
  const [saving, setSaving] = useState(false)

  const [estimate, setEstimate] = useState<RouteSalesEstimateDTO | null>(null)
  const [loadingEstimate, setLoadingEstimate] = useState(false)

  const [toDelete, setToDelete] = useState<RouteTemplateDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = async () => {
    if (!user?.id_client) return
    setLoading(true)
    try {
      const [templatesRes, storesRes] = await Promise.all([
        getRouteTemplates(user.id_client),
        getStockMapData({ id_client: user.id_client }),
      ])
      setTemplates(templatesRes.data ?? [])
      setStores(storesRes.data ?? [])
    } catch {
      toast.error("Error al cargar las rutas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user?.id_client])

  useEffect(() => {
    if (!building || selectedStoreIds.length === 0) {
      setEstimate(null)
      return
    }
    setLoadingEstimate(true)
    const timeout = setTimeout(() => {
      estimateRouteSales(selectedStoreIds)
        .then((res) => setEstimate(res.data))
        .catch(() => {})
        .finally(() => setLoadingEstimate(false))
    }, 400)
    return () => clearTimeout(timeout)
  }, [selectedStoreIds, building])

  const openCreate = () => {
    setEditing(null)
    setName("")
    setRecurrenceType("SEMANAL")
    setDayOfWeek(1)
    setIntervalWeeks(1)
    setSpecificDates([])
    setDateInput("")
    setSelectedStoreIds([])
    setStoreSearch("")
    setBuilding(true)
  }

  const openEdit = (t: RouteTemplateDTO) => {
    setEditing(t)
    setName(t.name)
    setRecurrenceType(t.recurrence_type)
    setDayOfWeek(t.day_of_week ?? 1)
    setIntervalWeeks(t.interval_weeks ?? 1)
    setSpecificDates(t.specific_dates ? t.specific_dates.split(",") : [])
    setDateInput("")
    setSelectedStoreIds(t.stores.map((s) => s.id_store))
    setStoreSearch("")
    setBuilding(true)
  }

  const toggleStore = (id_store: number) => {
    setSelectedStoreIds((prev) => (prev.includes(id_store) ? prev.filter((s) => s !== id_store) : [...prev, id_store]))
  }

  const addDate = () => {
    if (!dateInput) return
    if (specificDates.includes(dateInput)) {
      toast.error("Esa fecha ya está agregada")
      return
    }
    setSpecificDates((prev) => [...prev, dateInput].sort())
    setDateInput("")
  }

  const removeDate = (date: string) => {
    setSpecificDates((prev) => prev.filter((d) => d !== date))
  }

  const visibleStores = useMemo(
    () => stores.filter((s) => s.name.toLowerCase().includes(storeSearch.toLowerCase())),
    [stores, storeSearch]
  )

  const mapCenter = useMemo(() => {
    const withCoords = stores.filter((s) => s.latitude && s.longitude)
    if (withCoords.length === 0) return DEFAULT_CENTER
    const lat = withCoords.reduce((sum, s) => sum + s.latitude, 0) / withCoords.length
    const lng = withCoords.reduce((sum, s) => sum + s.longitude, 0) / withCoords.length
    return { lat, lng }
  }, [stores])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Ponle un nombre a la ruta")
      return
    }
    if (recurrenceType === "SEMANAL" && (!dayOfWeek || !intervalWeeks)) {
      toast.error("Selecciona el día y cada cuántas semanas se repite")
      return
    }
    if (recurrenceType === "FECHAS" && specificDates.length === 0) {
      toast.error("Agrega al menos una fecha")
      return
    }
    if (selectedStoreIds.length === 0) {
      toast.error("Selecciona al menos una tienda")
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        recurrence_type: recurrenceType,
        day_of_week: recurrenceType === "SEMANAL" ? dayOfWeek : null,
        interval_weeks: recurrenceType === "SEMANAL" ? intervalWeeks : null,
        specific_dates: recurrenceType === "FECHAS" ? specificDates.join(",") : null,
        storeIds: selectedStoreIds,
      }
      if (editing) {
        await updateRouteTemplate(editing.id_route_template, payload)
        toast.success("Ruta actualizada")
      } else {
        if (!user?.id_client) return
        await createRouteTemplate({ id_client: user.id_client, ...payload })
        toast.success("Ruta creada")
      }
      setBuilding(false)
      fetchData()
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar la ruta")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteRouteTemplate(toDelete.id_route_template)
      toast.success("Ruta eliminada")
      setToDelete(null)
      fetchData()
    } catch (e: any) {
      toast.error(e?.message || "Error al eliminar la ruta")
    } finally {
      setDeleting(false)
    }
  }

  if (building) {
    return (
      <PageWrapper>
        <div className="flex items-center gap-3">
          <button onClick={() => setBuilding(false)} className="p-2 rounded-lg hover:bg-muted">
            <ArrowLeft size={18} />
          </button>
          <PageHeader title={editing ? "Editar ruta" : "Nueva ruta"} subtitle="Elige las tiendas en el mapa o la lista, y dile cada cuándo se repite" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-xl border border-border bg-white p-4 space-y-3">
              <div>
                <Label>Nombre de la ruta</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Ruta Centro Lunes" />
              </div>
              <div>
                <Label>¿Con qué frecuencia se repite?</Label>
                <Select value={recurrenceType} onValueChange={(v) => setRecurrenceType(v as typeof recurrenceType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEMANAL">Un día de la semana</SelectItem>
                    <SelectItem value="FECHAS">Fechas específicas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recurrenceType === "SEMANAL" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Día</Label>
                    <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DIAS_SEMANA.map((d) => (
                          <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Repetición</Label>
                    <Select value={String(intervalWeeks)} onValueChange={(v) => setIntervalWeeks(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INTERVALOS_SEMANAS.map((i) => (
                          <SelectItem key={i.value} value={String(i.value)}>{i.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {recurrenceType === "FECHAS" && (
                <div>
                  <Label className="text-xs">Agregar fecha</Label>
                  <div className="flex gap-2">
                    <Input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} className="flex-1" />
                    <Button type="button" variant="outline" onClick={addDate}>Agregar</Button>
                  </div>
                  {specificDates.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {specificDates.map((d) => (
                        <Badge key={d} variant="outline" className="text-xs gap-1">
                          {new Date(d + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                          <button onClick={() => removeDate(d)}><X size={11} /></button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-white p-4 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-success" />
                <h3 className="text-sm font-semibold text-foreground">Venta estimada de esta ruta</h3>
              </div>
              {selectedStoreIds.length === 0 ? (
                <p className="text-xs text-muted-foreground">Selecciona tiendas para ver la estimación.</p>
              ) : loadingEstimate ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 size={12} className="animate-spin" /> Calculando...
                </div>
              ) : estimate ? (
                <>
                  <p className="text-2xl font-bold text-success">{formatMoney(estimate.total)}</p>
                  {estimate.stores.some((s) => !s.has_minimums) && (
                    <div className="flex gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                      <Info size={13} className="shrink-0 mt-0.5" />
                      <span>
                        Te podríamos decir cuánto te podría generar el resto de la ruta, solo que a{" "}
                        {estimate.stores.filter((s) => !s.has_minimums).length === 1 ? "una tienda" : `${estimate.stores.filter((s) => !s.has_minimums).length} tiendas`}{" "}
                        no ha ido un promotor de Promotoria Digital a contar el inventario, así que no contamos con los mínimos.
                      </span>
                    </div>
                  )}
                  {estimate.stores.some((s) => s.is_stale) && (
                    <div className="flex gap-1.5 text-xs text-muted-foreground bg-warning/10 rounded-lg p-2">
                      <AlertTriangle size={13} className="shrink-0 mt-0.5 text-warning-foreground dark:text-warning" />
                      <span>
                        {estimate.stores.filter((s) => s.is_stale).length === 1 ? "Una tienda tiene" : `${estimate.stores.filter((s) => s.is_stale).length} tiendas tienen`}{" "}
                        su última actualización de Promotoria Digital de hace más de 15 días, así que no damos un diagnóstico de esa(s) tienda(s) por falta de información reciente.
                      </span>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4" style={{ height: 'calc(100vh - 280px)', minHeight: 420 }}>
            <div className="rounded-xl overflow-hidden border border-border relative">
              {(!isLoaded) && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                  <Loader2 className="animate-spin text-muted-foreground" size={24} />
                </div>
              )}
              {isLoaded && (
                <GoogleMap mapContainerStyle={MAP_CONTAINER_STYLE} center={mapCenter} zoom={stores.length > 0 ? 11 : 6}>
                  {visibleStores.filter((s) => s.latitude && s.longitude).map((store) => (
                    <StoreMarker
                      key={store.id_store}
                      store={store}
                      selected={false}
                      routeOrder={selectedStoreIds.includes(store.id_store) ? selectedStoreIds.indexOf(store.id_store) + 1 : null}
                      onClick={() => toggleStore(store.id_store)}
                    />
                  ))}
                </GoogleMap>
              )}
            </div>

            <div className="rounded-xl border border-border bg-white flex flex-col overflow-hidden">
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  <Input value={storeSearch} onChange={(e) => setStoreSearch(e.target.value)} placeholder="Buscar tienda..." className="pl-8" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{selectedStoreIds.length} tienda{selectedStoreIds.length !== 1 ? "s" : ""} seleccionada{selectedStoreIds.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {visibleStores.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No hay tiendas que coincidan.</p>
                ) : (
                  visibleStores.map((s) => (
                    <div
                      key={s.id_store}
                      onClick={() => toggleStore(s.id_store)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        selectedStoreIds.includes(s.id_store) ? "bg-info/10 border-info/30" : "bg-white border-border hover:border-input"
                      }`}
                    >
                      <Checkbox checked={selectedStoreIds.includes(s.id_store)} className="pointer-events-none" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.municipio_name}, {s.state_name}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setBuilding(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
            Guardar ruta
          </Button>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Crear Ruta"
        subtitle="Arma una ruta una sola vez (nombre, tiendas y frecuencia) para adjuntarla luego al organizar la entrega, sin buscar tienda por tienda cada vez"
        icon={RouteIcon}
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} className="mr-2" /> Nueva ruta
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          Aún no has creado ninguna ruta.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t.id_route_template} className="rounded-xl border border-border bg-white p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-foreground">{t.name}</h3>
                  <Badge variant="outline" className="text-xs mt-1">{describeRecurrence(t)}</Badge>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-muted">
                    <Pencil size={15} className="text-muted-foreground" />
                  </button>
                  <button onClick={() => setToDelete(t)} className="p-1.5 rounded-lg hover:bg-destructive/10">
                    <Trash2 size={15} className="text-destructive" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Store size={14} /> {t.stores.length} tienda{t.stores.length !== 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar "{toDelete?.name}"</AlertDialogTitle>
            <AlertDialogDescription>
              Esto no afecta rutas de entrega que ya hayas organizado con estas tiendas, solo elimina la plantilla para adjuntarla en el futuro.
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
    </PageWrapper>
  )
}
