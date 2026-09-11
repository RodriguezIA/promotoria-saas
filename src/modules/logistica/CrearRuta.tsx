import { toast } from "sonner"
import { useEffect, useState } from "react"
import { Route as RouteIcon, Plus, Pencil, Trash2, Loader2, Store, Search } from "lucide-react"

import { useAuthStore } from "@/stores"
import { api, ApiResponse } from "@/lib"
import { StoreDTO } from "@/dtos"
import {
  PageWrapper, PageHeader, Button, Input, Label, Checkbox,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Badge,
} from "@/components"
import {
  getRouteTemplates, createRouteTemplate, updateRouteTemplate, deleteRouteTemplate,
  RouteTemplateDTO, DIAS_SEMANA, RECURRENCE_LABELS,
} from "@/Fetch/routeTemplates"

export default function CrearRuta() {
  const { user } = useAuthStore()
  const [templates, setTemplates] = useState<RouteTemplateDTO[]>([])
  const [stores, setStores] = useState<StoreDTO[]>([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<RouteTemplateDTO | null>(null)
  const [name, setName] = useState("")
  const [recurrenceType, setRecurrenceType] = useState<"DIAS" | "SEMANA" | "QUINCENA" | "MES">("SEMANA")
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([])
  const [storeSearch, setStoreSearch] = useState("")
  const [saving, setSaving] = useState(false)

  const [toDelete, setToDelete] = useState<RouteTemplateDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = async () => {
    if (!user?.id_client) return
    setLoading(true)
    try {
      const [templatesRes, storesRes] = await Promise.all([
        getRouteTemplates(user.id_client),
        api.get<ApiResponse<StoreDTO[]>>(`/stores/`),
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

  const openCreate = () => {
    setEditing(null)
    setName("")
    setRecurrenceType("SEMANA")
    setSelectedDays([])
    setSelectedStoreIds([])
    setStoreSearch("")
    setShowForm(true)
  }

  const openEdit = (t: RouteTemplateDTO) => {
    setEditing(t)
    setName(t.name)
    setRecurrenceType(t.recurrence_type)
    setSelectedDays(t.recurrence_days ? t.recurrence_days.split(",").map(Number) : [])
    setSelectedStoreIds(t.stores.map((s) => s.id_store))
    setStoreSearch("")
    setShowForm(true)
  }

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const toggleStore = (id_store: number) => {
    setSelectedStoreIds((prev) => (prev.includes(id_store) ? prev.filter((s) => s !== id_store) : [...prev, id_store]))
  }

  const tiendasFiltradas = stores.filter((s) => s.name.toLowerCase().includes(storeSearch.toLowerCase()))

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Ponle un nombre a la ruta")
      return
    }
    if (recurrenceType === "DIAS" && selectedDays.length === 0) {
      toast.error("Selecciona al menos un día")
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
        recurrence_days: recurrenceType === "DIAS" ? selectedDays.sort((a, b) => a - b).join(",") : null,
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
      setShowForm(false)
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

  const recurrenceSummary = (t: RouteTemplateDTO) => {
    if (t.recurrence_type === "DIAS" && t.recurrence_days) {
      const dias = t.recurrence_days.split(",").map(Number)
      return dias.map((d) => DIAS_SEMANA.find((x) => x.value === d)?.label.slice(0, 3)).join(", ")
    }
    return RECURRENCE_LABELS[t.recurrence_type] ?? t.recurrence_type
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
                  <Badge variant="outline" className="text-xs mt-1">{recurrenceSummary(t)}</Badge>
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

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar ruta" : "Nueva ruta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nombre de la ruta</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Ruta Centro Lunes" />
            </div>

            <div>
              <Label>¿Con qué frecuencia se repite?</Label>
              <Select value={recurrenceType} onValueChange={(v) => setRecurrenceType(v as typeof recurrenceType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIAS">Días específicos</SelectItem>
                  <SelectItem value="SEMANA">Toda la semana</SelectItem>
                  <SelectItem value="QUINCENA">Toda la quincena</SelectItem>
                  <SelectItem value="MES">Todo el mes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recurrenceType === "DIAS" && (
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      selectedDays.includes(d.value)
                        ? "bg-info/10 border-info/30 text-info"
                        : "bg-white border-border text-muted-foreground hover:border-input"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}

            <div>
              <Label>Tiendas de esta ruta ({selectedStoreIds.length} seleccionadas)</Label>
              <div className="relative mt-1 mb-2">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder="Buscar tienda..."
                  className="pl-8"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 border border-border rounded-lg p-2">
                {tiendasFiltradas.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2 col-span-2 text-center">No hay tiendas que coincidan.</p>
                ) : (
                  tiendasFiltradas.map((s) => (
                    <div
                      key={s.id_store}
                      onClick={() => toggleStore(s.id_store)}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        selectedStoreIds.includes(s.id_store) ? "bg-info/10 border-info/30" : "bg-white border-border hover:border-input"
                      }`}
                    >
                      <Checkbox checked={selectedStoreIds.includes(s.id_store)} className="pointer-events-none" />
                      <span className="text-sm truncate">{s.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
              Guardar ruta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
