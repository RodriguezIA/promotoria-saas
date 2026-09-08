import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { GoogleMap } from '@react-google-maps/api'
import { Loader2, MapPin, ChevronLeft, ListChecks, History, Route as RouteIcon, X, GripVertical, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { api, ApiResponse, useJsApiLoader, GOOGLE_MAPS_CONFIG } from '@/lib'
import { useAuthStore } from '@/stores'
import {
  PageWrapper,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Input,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
} from '@/components'
import { channelSalesDTO, MapStoreDTO, StateDTO, CityDTO, ProductDTO } from '@/dtos'
import { getStockMapData, getStockMinimumsByStore, setStockMinimum } from '@/Fetch/stock'
import { getProductsByClient } from '@/Fetch/products'
import { getDrivers, DriverDTO } from '@/Fetch/drivers'
import { getPendingPreorders, createRoute, PendingPreorderDTO } from '@/Fetch/delivery-routes'
import { StoreMarker } from './components/StoreMarker'
import { PromoterMarker } from './components/PromoterMarker'
import { StoreOrderHistory } from './components/StoreOrderHistory'

const FILTRO_TODOS = 'todos'
const DEFAULT_COUNTRY_ID = 1
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' }
const DEFAULT_CENTER = { lat: 25.7460, lng: -100.2792 } // Nuevo León, como default razonable

const SEMAPHORE_LABEL: Record<string, string> = {
  red: 'Bajo el mínimo',
  yellow: 'Cerca del mínimo',
  green: 'Bien surtida',
}
const SEMAPHORE_DOT: Record<string, string> = {
  red: 'bg-destructive',
  yellow: 'bg-warning',
  green: 'bg-success',
}

interface SelectedStop {
  id_store: number
  id_preorder: number
  store_name: string
}

export default function Mapa() {
  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_CONFIG)
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const idClient = user?.id_client && user.id_client > 0 ? user.id_client : undefined

  const [channels, setChannels] = useState<channelSalesDTO[]>([])
  const [states, setStates] = useState<StateDTO[]>([])
  const [cities, setCities] = useState<CityDTO[]>([])

  const [canal, setCanal] = useState(FILTRO_TODOS)
  const [estado, setEstado] = useState(FILTRO_TODOS)
  const [municipio, setMunicipio] = useState(FILTRO_TODOS)

  const [stores, setStores] = useState<MapStoreDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStore, setSelectedStore] = useState<MapStoreDTO | null>(null)

  // --- Prepedidos pendientes de surtir (para el indicador y para armar rutas) ---
  const [pendingPreorders, setPendingPreorders] = useState<PendingPreorderDTO[]>([])
  const pendingByStore = useMemo(() => {
    const map = new Map<number, PendingPreorderDTO[]>()
    pendingPreorders.forEach((p) => {
      const list = map.get(p.task.store.id_store) ?? []
      list.push(p)
      map.set(p.task.store.id_store, list)
    })
    return map
  }, [pendingPreorders])

  const loadPendingPreorders = () => {
    getPendingPreorders()
      .then((res) => setPendingPreorders(res.data))
      .catch(() => toast.error('Error al cargar los prepedidos pendientes'))
  }

  // --- Organizar ruta ---
  const [showRouteSetup, setShowRouteSetup] = useState(false)
  const [drivers, setDrivers] = useState<DriverDTO[]>([])
  const [routeDriverId, setRouteDriverId] = useState('')
  const [routeDate, setRouteDate] = useState('')
  const [routeMode, setRouteMode] = useState<'mapa' | 'lista' | null>(null)
  const [buildingRoute, setBuildingRoute] = useState(false)
  const [selectedStops, setSelectedStops] = useState<SelectedStop[]>([])
  const [savingRoute, setSavingRoute] = useState(false)

  const openRouteSetup = () => {
    getDrivers().then((res) => setDrivers(res.data)).catch(() => toast.error('Error al cargar los choferes'))
    setRouteDriverId('')
    setRouteDate(new Date().toISOString().slice(0, 10))
    setRouteMode(null)
    setShowRouteSetup(true)
  }

  const startBuildingRoute = () => {
    if (!routeDriverId || !routeDate || !routeMode) {
      toast.error('Selecciona chofer, fecha y modo')
      return
    }
    setShowRouteSetup(false)
    setSelectedStops([])
    setBuildingRoute(true)
  }

  const toggleStopFromMap = (store: MapStoreDTO) => {
    const pending = pendingByStore.get(store.id_store)
    if (!pending || pending.length === 0) return
    setSelectedStops((prev) => {
      const already = prev.find((s) => s.id_store === store.id_store)
      if (already) return prev.filter((s) => s.id_store !== store.id_store)
      return [...prev, { id_store: store.id_store, id_preorder: pending[0].id_preorder, store_name: store.name }]
    })
  }

  const toggleStopFromList = (p: PendingPreorderDTO) => {
    setSelectedStops((prev) => {
      const already = prev.find((s) => s.id_preorder === p.id_preorder)
      if (already) return prev.filter((s) => s.id_preorder !== p.id_preorder)
      return [...prev, { id_store: p.task.store.id_store, id_preorder: p.id_preorder, store_name: p.task.store.name }]
    })
  }

  const removeStop = (id_preorder: number) => {
    setSelectedStops((prev) => prev.filter((s) => s.id_preorder !== id_preorder))
  }

  const cancelRouteBuilding = () => {
    setBuildingRoute(false)
    setSelectedStops([])
    setRouteMode(null)
  }

  const confirmRoute = async () => {
    if (selectedStops.length === 0) {
      toast.error('Selecciona al menos una tienda')
      return
    }
    setSavingRoute(true)
    try {
      await createRoute({
        id_driver: Number(routeDriverId),
        route_date: routeDate,
        stops: selectedStops.map((s) => ({ id_store: s.id_store, id_preorder: s.id_preorder })),
      })
      toast.success('Ruta creada y asignada al chofer')
      cancelRouteBuilding()
      loadPendingPreorders()
    } catch (e: any) {
      toast.error(e?.message || 'Error al crear la ruta')
    } finally {
      setSavingRoute(false)
    }
  }

  // --- Catálogos para los filtros ---
  useEffect(() => {
    api.get<ApiResponse<channelSalesDTO[]>>('/channel-sales/')
      .then((res) => setChannels(res.data))
      .catch(() => toast.error('Error al cargar los canales de venta'))
  }, [])

  useEffect(() => {
    api.get<ApiResponse<StateDTO[]>>(`/clients/states/${DEFAULT_COUNTRY_ID}`)
      .then((res) => setStates(res.data))
      .catch(() => toast.error('Error al cargar los estados'))
  }, [])

  useEffect(() => {
    if (estado === FILTRO_TODOS) {
      setCities([])
      return
    }
    api.get<ApiResponse<CityDTO[]>>(`/clients/cities/${estado}`)
      .then((res) => setCities(res.data))
      .catch(() => toast.error('Error al cargar los municipios'))
  }, [estado])

  // --- Datos del mapa ---
  const loadMapData = () => {
    setLoading(true)
    getStockMapData({
      id_channel: canal !== FILTRO_TODOS ? Number(canal) : undefined,
      id_state: estado !== FILTRO_TODOS ? Number(estado) : undefined,
      id_municipio: municipio !== FILTRO_TODOS ? Number(municipio) : undefined,
      id_client: idClient,
    })
      .then((res) => setStores(res.data))
      .catch(() => toast.error('Error al cargar el mapa'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadMapData()
    loadPendingPreorders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canal, estado, municipio, idClient])

  const mapCenter = useMemo(() => {
    if (stores.length === 0) return DEFAULT_CENTER
    const withCoords = stores.filter((s) => s.latitude && s.longitude)
    if (withCoords.length === 0) return DEFAULT_CENTER
    const lat = withCoords.reduce((sum, s) => sum + s.latitude, 0) / withCoords.length
    const lng = withCoords.reduce((sum, s) => sum + s.longitude, 0) / withCoords.length
    return { lat, lng }
  }, [stores])

  const totalActivePromoters = stores.reduce((sum, s) => sum + s.active_promoters.length, 0)

  return (
    <PageWrapper>
      <PageHeader title="Logística" subtitle="Ubicación de tiendas, promotores activos, inventario y rutas de entrega en vivo" />

      <div className="flex justify-end gap-2 mb-3">
        {!buildingRoute && (
          <>
            <Button variant="outline" size="sm" onClick={() => navigate('/mapa/asignar-minimos')}>
              <ListChecks size={16} className="mr-1.5" /> Asignar mínimos por lote
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedStore(stores[0] ?? null)} disabled={stores.length === 0}>
              <History size={16} className="mr-1.5" /> Ver historial de tiendas
            </Button>
            <Button size="sm" onClick={openRouteSetup}>
              <RouteIcon size={16} className="mr-1.5" /> Organizar ruta
            </Button>
          </>
        )}
        {buildingRoute && (
          <>
            <Badge variant="outline" className="mr-auto">
              Modo {routeMode === 'mapa' ? 'mapa' : 'lista'}: dale clic a las tiendas con pedido pendiente para agregarlas a la ruta, en el orden que se van a visitar.
            </Badge>
            <Button variant="ghost" size="sm" onClick={cancelRouteBuilding} disabled={savingRoute}>
              Cancelar
            </Button>
            <Button size="sm" onClick={confirmRoute} disabled={savingRoute || selectedStops.length === 0}>
              {savingRoute && <Loader2 size={14} className="mr-1.5 animate-spin" />}
              Confirmar ruta ({selectedStops.length})
            </Button>
          </>
        )}
      </div>

      {/* Filtros */}
      {!buildingRoute && (
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={canal} onValueChange={setCanal}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Canal de venta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTRO_TODOS}>Todos los canales</SelectItem>
              {channels.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={estado} onValueChange={(v) => { setEstado(v); setMunicipio(FILTRO_TODOS) }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTRO_TODOS}>Todos los estados</SelectItem>
              {states.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={municipio} onValueChange={setMunicipio} disabled={estado === FILTRO_TODOS}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Municipio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTRO_TODOS}>Todos los municipios</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-4 ml-auto text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-destructive" /> Bajo mínimo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-warning" /> Cerca del mínimo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-success" /> Bien surtida
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-info" /> {totalActivePromoters} promotor(es) activo(s)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-warning flex items-center justify-center" /> {pendingPreorders.length} pedido(s) pendiente(s)
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-4" style={{ height: 'calc(100vh - 260px)', minHeight: 480 }}>
        {/* Mapa */}
        <div className="flex-1 rounded-xl overflow-hidden border border-border relative">
          {(loading || !isLoaded) && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
              <Loader2 className="animate-spin text-muted-foreground" size={28} />
            </div>
          )}
          {isLoaded && (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              center={mapCenter}
              zoom={stores.length > 0 ? 11 : 6}
            >
              {stores.map((store) => {
                const stopIndex = selectedStops.findIndex((s) => s.id_store === store.id_store)
                return (
                  <StoreMarker
                    key={store.id_store}
                    store={store}
                    selected={selectedStore?.id_store === store.id_store}
                    hasPendingOrder={pendingByStore.has(store.id_store)}
                    routeOrder={buildingRoute && routeMode === 'mapa' && stopIndex >= 0 ? stopIndex + 1 : null}
                    onClick={() =>
                      buildingRoute && routeMode === 'mapa' ? toggleStopFromMap(store) : setSelectedStore(store)
                    }
                  />
                )
              })}
              {!buildingRoute && stores.flatMap((store) =>
                store.active_promoters.map((p) => (
                  <PromoterMarker key={p.id_promoter} promoter={p} storeName={store.name} />
                ))
              )}
            </GoogleMap>
          )}
        </div>

        {/* Panel lateral: detalle de tienda, o lista de seleccion de ruta */}
        {buildingRoute && routeMode === 'lista' && (
          <RouteListPicker
            pendingPreorders={pendingPreorders}
            selectedStops={selectedStops}
            onToggle={toggleStopFromList}
          />
        )}
        {buildingRoute && selectedStops.length > 0 && (
          <RouteSummaryPanel selectedStops={selectedStops} onRemove={removeStop} />
        )}
        {!buildingRoute && selectedStore && (
          <StoreDetailPanel
            store={selectedStore}
            idClient={idClient}
            pending={pendingByStore.get(selectedStore.id_store) ?? []}
            onClose={() => setSelectedStore(null)}
            onMinimumSaved={loadMapData}
          />
        )}
      </div>

      {/* Configurar ruta: chofer, fecha, modo */}
      <Dialog open={showRouteSetup} onOpenChange={setShowRouteSetup}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Organizar ruta de entrega</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>¿A qué chofer le asignamos esta ruta?</Label>
              <Select value={routeDriverId} onValueChange={setRouteDriverId}>
                <SelectTrigger><SelectValue placeholder="Selecciona un chofer" /></SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d.id_driver} value={String(d.id_driver)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {drivers.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  No tienes choferes dados de alta todavía. Ve al menú "Choferes" para agregar uno.
                </p>
              )}
            </div>
            <div>
              <Label>Fecha de la ruta</Label>
              <Input type="date" value={routeDate} onChange={(e) => setRouteDate(e.target.value)} />
            </div>
            <div>
              <Label>¿Cómo quieres armar la ruta?</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setRouteMode('mapa')}
                  className={`rounded-lg border-2 p-3 text-sm text-left transition-colors ${routeMode === 'mapa' ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <MapPin size={18} className="mb-1" />
                  <p className="font-medium">Con mapa</p>
                  <p className="text-xs text-muted-foreground">Dale clic a las tiendas en el orden que las vas a visitar</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRouteMode('lista')}
                  className={`rounded-lg border-2 p-3 text-sm text-left transition-colors ${routeMode === 'lista' ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <ListChecks size={18} className="mb-1" />
                  <p className="font-medium">Con listado</p>
                  <p className="text-xs text-muted-foreground">Marca las tiendas de una lista buscable</p>
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRouteSetup(false)}>Cancelar</Button>
            <Button onClick={startBuildingRoute}>Empezar a armar la ruta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}

function RouteSummaryPanel({ selectedStops, onRemove }: { selectedStops: SelectedStop[]; onRemove: (id_preorder: number) => void }) {
  return (
    <div className="w-[300px] shrink-0 rounded-xl border border-border bg-white p-4 overflow-y-auto">
      <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">
        Orden de la ruta ({selectedStops.length})
      </p>
      <ul className="space-y-2">
        {selectedStops.map((s, i) => (
          <li key={s.id_preorder} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <GripVertical size={14} className="text-muted-foreground/50" />
            <span className="w-5 h-5 rounded-full bg-success text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
            <span className="text-sm flex-1 truncate">{s.store_name}</span>
            <button type="button" onClick={() => onRemove(s.id_preorder)} className="text-muted-foreground hover:text-destructive">
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RouteListPicker({
  pendingPreorders,
  selectedStops,
  onToggle,
}: {
  pendingPreorders: PendingPreorderDTO[]
  selectedStops: SelectedStop[]
  onToggle: (p: PendingPreorderDTO) => void
}) {
  const [search, setSearch] = useState('')
  const filtered = pendingPreorders.filter((p) =>
    p.task.store.name.toLowerCase().includes(search.toLowerCase())
  )
  const selectedIds = new Set(selectedStops.map((s) => s.id_preorder))

  return (
    <div className="w-[320px] shrink-0 rounded-xl border border-border bg-white p-4 overflow-y-auto">
      <Input
        placeholder="Buscar tienda..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3"
      />
      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
        Pedidos pendientes ({filtered.length})
      </p>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground/70">No hay pedidos pendientes que coincidan.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((p) => {
            const isSelected = selectedIds.has(p.id_preorder)
            return (
              <li key={p.id_preorder}>
                <button
                  type="button"
                  onClick={() => onToggle(p)}
                  className={`w-full text-left rounded-lg border-2 px-3 py-2 transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{p.task.store.name}</span>
                    {isSelected && <Check size={14} className="text-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.preferred_date).toLocaleDateString('es-MX')} · {p.preferred_time === 'MAÑANA' ? 'Por la mañana' : 'Por la tarde'}
                  </p>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function StoreDetailPanel({
  store,
  idClient,
  pending,
  onClose,
  onMinimumSaved,
}: {
  store: MapStoreDTO
  idClient?: number
  pending: PendingPreorderDTO[]
  onClose: () => void
  onMinimumSaved: () => void
}) {
  const [minimums, setMinimums] = useState<Record<number, string>>({})
  const [savingId, setSavingId] = useState<number | null>(null)
  const [allProducts, setAllProducts] = useState<ProductDTO[]>([])
  const [showAddProduct, setShowAddProduct] = useState(false)

  const loadMinimums = () => {
    getStockMinimumsByStore(store.id_store, idClient)
      .then((res) => {
        const map: Record<number, string> = {}
        res.data.forEach((m) => { map[m.id_product] = String(m.i_minimum) })
        setMinimums(map)
      })
      .catch(() => toast.error('Error al cargar los mínimos de esta tienda'))
  }

  useEffect(() => {
    loadMinimums()
    if (idClient) {
      getProductsByClient(idClient)
        .then((res: ApiResponse<ProductDTO[]>) => setAllProducts(res.data))
        .catch(() => toast.error('Error al cargar el catálogo de productos'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.id_store, idClient])

  const productsWithMinimum = new Set(store.products.map((p) => p.id_product))
  const productsWithoutMinimum = allProducts.filter((p) => !productsWithMinimum.has(p.id_product))

  const saveMinimum = async (id_product: number) => {
    const value = Number(minimums[id_product])
    if (Number.isNaN(value) || value < 0 || minimums[id_product] === undefined || minimums[id_product] === '') {
      toast.error('El mínimo debe ser un número válido')
      return
    }
    setSavingId(id_product)
    try {
      await setStockMinimum({ id_product, id_store: store.id_store, i_minimum: value })
      toast.success('Mínimo actualizado')
      loadMinimums()
      onMinimumSaved()
    } catch {
      toast.error('Error al guardar el mínimo')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="w-[340px] shrink-0 rounded-xl border border-border bg-white p-4 overflow-y-auto">
      <button
        type="button"
        onClick={onClose}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
      >
        <ChevronLeft size={16} /> Cerrar
      </button>

      <div className="flex items-start gap-3 mb-1">
        {store.channel?.logo && (
          <img src={store.channel.logo} alt={store.channel.name} className="w-10 h-10 rounded-lg object-cover border border-border" />
        )}
        <div>
          <h3 className="font-bold text-foreground leading-tight">{store.name}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin size={12} /> {store.municipio_name}, {store.state_name}
          </p>
        </div>
      </div>

      {store.semaphore && (
        <Badge variant="outline" className="mt-2 gap-1.5">
          <span className={`w-2 h-2 rounded-full ${SEMAPHORE_DOT[store.semaphore]}`} />
          {SEMAPHORE_LABEL[store.semaphore]}
        </Badge>
      )}

      {pending.length > 0 && (
        <div className="mt-4 rounded-lg border-2 border-warning/40 bg-warning/10 p-3">
          <p className="text-xs font-bold text-warning-foreground dark:text-warning uppercase mb-2">
            Pedido sin surtir
          </p>
          {pending.map((p) => (
            <div key={p.id_preorder} className="text-sm mb-2 last:mb-0">
              <p className="text-muted-foreground text-xs mb-1">
                Para el {new Date(p.preferred_date).toLocaleDateString('es-MX')} · {p.preferred_time === 'MAÑANA' ? 'por la mañana' : 'por la tarde'}
              </p>
              {p.items.map((item) => (
                <p key={item.id_item}>
                  <span className="font-bold">{item.i_quantity}</span> {item.product.name}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
          Historial de pedidos
        </p>
        <StoreOrderHistory idStore={store.id_store} />
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
          Promotores activos ({store.active_promoters.length})
        </p>
        {store.active_promoters.length === 0 ? (
          <p className="text-sm text-muted-foreground/70">Nadie activo aquí ahora mismo.</p>
        ) : (
          <ul className="space-y-1.5">
            {store.active_promoters.map((p) => (
              <li key={p.id_promoter} className="text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-info" /> {p.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
          Inventario y mínimos por producto
        </p>
        {store.products.length === 0 ? (
          <p className="text-sm text-muted-foreground/70">
            Esta tienda todavía no tiene mínimos configurados para ningún producto.
          </p>
        ) : (
          <div className="space-y-3">
            {store.products.map((p) => (
              <div key={p.id_product} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  {p.semaphore && (
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${SEMAPHORE_DOT[p.semaphore]}`} />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Última existencia reportada: <strong>{p.quantity ?? 'sin reportes aún'}</strong>
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={minimums[p.id_product] ?? ''}
                    onChange={(e) => setMinimums((prev) => ({ ...prev, [p.id_product]: e.target.value }))}
                    placeholder="Mínimo"
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={savingId === p.id_product}
                    onClick={() => saveMinimum(p.id_product)}
                  >
                    {savingId === p.id_product ? <Loader2 size={14} className="animate-spin" /> : 'Guardar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {idClient && productsWithoutMinimum.length > 0 && (
          <div className="mt-3">
            {!showAddProduct ? (
              <Button size="sm" variant="ghost" className="w-full" onClick={() => setShowAddProduct(true)}>
                + Agregar mínimo a otro producto
              </Button>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
                {productsWithoutMinimum.map((p) => (
                  <div key={p.id_product} className="flex items-center gap-2">
                    <span className="text-sm flex-1 truncate">{p.name}</span>
                    <Input
                      type="number"
                      min={0}
                      value={minimums[p.id_product] ?? ''}
                      onChange={(e) => setMinimums((prev) => ({ ...prev, [p.id_product]: e.target.value }))}
                      placeholder="Mínimo"
                      className="h-8 text-sm w-24"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={savingId === p.id_product}
                      onClick={() => saveMinimum(p.id_product)}
                    >
                      {savingId === p.id_product ? <Loader2 size={14} className="animate-spin" /> : 'Guardar'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
