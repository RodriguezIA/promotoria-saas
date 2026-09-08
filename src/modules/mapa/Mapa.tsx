import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { GoogleMap } from '@react-google-maps/api'
import { Loader2, MapPin, ChevronLeft, ListChecks, Route as RouteIcon } from 'lucide-react'
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
import { StoreDeliveryHistory } from './components/StoreDeliveryHistory'

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
  id_preorder: number | null
  store_name: string
  semaphore: 'red' | 'yellow' | 'green' | null
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

  // --- Filtro por indicador (semaforo o pendientes de surtir) ---
  const [activeFilter, setActiveFilter] = useState<'red' | 'yellow' | 'green' | 'pending' | null>(null)

  // --- Prepedidos pendientes de surtir (para el indicador y para armar rutas) ---
  const [pendingPreorders, setPendingPreorders] = useState<PendingPreorderDTO[]>([])
  const [preorderDateFilter, setPreorderDateFilter] = useState('')
  const [preorderTimeFilter, setPreorderTimeFilter] = useState<'todos' | 'MAÑANA' | 'TARDE'>('todos')
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
    getPendingPreorders({
      date: preorderDateFilter || undefined,
      time: preorderTimeFilter !== 'todos' ? preorderTimeFilter : undefined,
    })
      .then((res) => setPendingPreorders(res.data))
      .catch(() => toast.error('Error al cargar los prepedidos pendientes'))
  }

  // Vuelve a cargar los pendientes cada vez que cambia el filtro de dia/turno,
  // para que "con pedido" en Organizar ruta solo cuente los de ese dia.
  useEffect(() => {
    loadPendingPreorders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preorderDateFilter, preorderTimeFilter])

  // --- Organizar ruta ---
  const [showRouteSetup, setShowRouteSetup] = useState(false)
  const [drivers, setDrivers] = useState<DriverDTO[]>([])
  const [routeDriverId, setRouteDriverId] = useState('')
  const [routeDate, setRouteDate] = useState('')
  const [buildingRoute, setBuildingRoute] = useState(false)
  const [selectedStops, setSelectedStops] = useState<SelectedStop[]>([])
  const [savingRoute, setSavingRoute] = useState(false)
  const [routeSearch, setRouteSearch] = useState('')
  const [routeFilter, setRouteFilter] = useState<'todas' | 'con_pedido' | 'sin_pedido' | 'red' | 'yellow' | 'green'>('todas')

  const openRouteSetup = () => {
    getDrivers().then((res) => setDrivers(res.data)).catch(() => toast.error('Error al cargar los choferes'))
    setRouteDriverId('')
    setRouteDate(new Date().toISOString().slice(0, 10))
    setShowRouteSetup(true)
  }

  const startBuildingRoute = () => {
    if (!routeDriverId || !routeDate) {
      toast.error('Selecciona chofer y fecha')
      return
    }
    setShowRouteSetup(false)
    setSelectedStops([])
    setActiveFilter(null)
    setRouteSearch('')
    setRouteFilter('todas')
    setBuildingRoute(true)
  }

  const toggleStop = (store: MapStoreDTO) => {
    const pending = pendingByStore.get(store.id_store)
    setSelectedStops((prev) => {
      const already = prev.find((s) => s.id_store === store.id_store)
      if (already) return prev.filter((s) => s.id_store !== store.id_store)
      return [...prev, {
        id_store: store.id_store,
        id_preorder: pending?.[0]?.id_preorder ?? null,
        store_name: store.name,
        semaphore: store.semaphore ?? null,
      }]
    })
  }

  const cancelRouteBuilding = () => {
    setBuildingRoute(false)
    setSelectedStops([])
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
        stops: selectedStops.map((s) => ({ id_store: s.id_store, id_preorder: s.id_preorder ?? undefined })),
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
  const countBySemaphore = useMemo(() => {
    const counts = { red: 0, yellow: 0, green: 0 }
    stores.forEach((s) => {
      if (s.semaphore === 'red') counts.red++
      else if (s.semaphore === 'yellow') counts.yellow++
      else if (s.semaphore === 'green') counts.green++
    })
    return counts
  }, [stores])

  // Solo filtra las tiendas que se muestran en el mapa; los promotores
  // activos siempre se ven, sin importar el filtro elegido. Mientras se
  // arma una ruta, usa el buscador + filtro de la lista de ruta en vez del
  // filtro normal de abajo, para que el mapa y la lista muestren siempre
  // exactamente las mismas tiendas.
  const visibleStores = useMemo(() => {
    if (buildingRoute) {
      return stores.filter((s) => {
        if (!s.name.toLowerCase().includes(routeSearch.toLowerCase())) return false
        if (routeFilter === 'con_pedido') return pendingByStore.has(s.id_store)
        if (routeFilter === 'sin_pedido') return !pendingByStore.has(s.id_store)
        if (routeFilter === 'red' || routeFilter === 'yellow' || routeFilter === 'green') return s.semaphore === routeFilter
        return true
      })
    }
    if (!activeFilter) return stores
    if (activeFilter === 'pending') return stores.filter((s) => pendingByStore.has(s.id_store))
    return stores.filter((s) => s.semaphore === activeFilter)
  }, [stores, activeFilter, pendingByStore, buildingRoute, routeSearch, routeFilter])

  const toggleFilter = (filter: 'red' | 'yellow' | 'green' | 'pending') => {
    setActiveFilter((prev) => (prev === filter ? null : filter))
  }

  return (
    <PageWrapper>
      <PageHeader title="Logística" subtitle="Ubicación de tiendas, promotores activos, inventario y rutas de entrega en vivo" />

      <div className="flex justify-end gap-2 mb-3">
        {!buildingRoute && (
          <>
            <Button variant="outline" size="sm" onClick={() => navigate('/mapa/asignar-minimos')}>
              <ListChecks size={16} className="mr-1.5" /> Asignar mínimos por lote
            </Button>
            <Button size="sm" onClick={openRouteSetup}>
              <RouteIcon size={16} className="mr-1.5" /> Organizar ruta
            </Button>
          </>
        )}
        {buildingRoute && (
          <>
            <Badge variant="outline" className="mr-auto">
              Selecciona las tiendas desde el mapa o la lista, en el orden en que se van a visitar.
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

        {!buildingRoute && (
          <div className="flex items-center gap-3 ml-auto text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => toggleFilter('red')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${activeFilter === 'red' ? 'bg-destructive/15 text-destructive' : 'hover:bg-muted'}`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-destructive" /> {countBySemaphore.red} bajo mínimo
            </button>
            <button
              type="button"
              onClick={() => toggleFilter('yellow')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${activeFilter === 'yellow' ? 'bg-warning/15 text-warning-foreground dark:text-warning' : 'hover:bg-muted'}`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-warning" /> {countBySemaphore.yellow} cerca del mínimo
            </button>
            <button
              type="button"
              onClick={() => toggleFilter('green')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${activeFilter === 'green' ? 'bg-success/15 text-success' : 'hover:bg-muted'}`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-success" /> {countBySemaphore.green} bien surtida(s)
            </button>
            <span className="flex items-center gap-1.5 px-2 py-1">
              <span className="w-2.5 h-2.5 rounded-full bg-info" /> {totalActivePromoters} promotor(es) activo(s)
            </span>
            <button
              type="button"
              onClick={() => toggleFilter('pending')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${activeFilter === 'pending' ? 'bg-warning/15 text-warning-foreground dark:text-warning' : 'hover:bg-muted'}`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-warning" /> {pendingPreorders.length} pedido(s) pendiente(s)
            </button>
            {activeFilter && (
              <button type="button" onClick={() => setActiveFilter(null)} className="text-xs underline text-muted-foreground/70">
                Ver todos
              </button>
            )}
          </div>
        )}
      </div>

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
              {visibleStores.map((store) => {
                const stopIndex = selectedStops.findIndex((s) => s.id_store === store.id_store)
                return (
                  <StoreMarker
                    key={store.id_store}
                    store={store}
                    selected={selectedStore?.id_store === store.id_store}
                    hasPendingOrder={pendingByStore.has(store.id_store)}
                    routeOrder={buildingRoute && stopIndex >= 0 ? stopIndex + 1 : null}
                    onClick={() =>
                      buildingRoute ? toggleStop(store) : setSelectedStore(store)
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

        {/* Panel lateral: detalle de tienda, o lista de seleccion de ruta (mapa y lista van conectados) */}
        {buildingRoute && (
          <RouteListPicker
            stores={visibleStores}
            pendingByStore={pendingByStore}
            selectedStops={selectedStops}
            onToggle={toggleStop}
            search={routeSearch}
            onSearchChange={setRouteSearch}
            filter={routeFilter}
            onFilterChange={setRouteFilter}
            preorderDate={preorderDateFilter}
            onPreorderDateChange={setPreorderDateFilter}
            preorderTime={preorderTimeFilter}
            onPreorderTimeChange={setPreorderTimeFilter}
          />
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

      {/* Configurar ruta: chofer, fecha */}
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

const SEMAPHORE_DOT_MAP: Record<string, string> = {
  red: 'bg-destructive',
  yellow: 'bg-warning',
  green: 'bg-success',
}

function RouteListPicker({
  stores,
  pendingByStore,
  selectedStops,
  onToggle,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  preorderDate,
  onPreorderDateChange,
  preorderTime,
  onPreorderTimeChange,
}: {
  stores: MapStoreDTO[]
  pendingByStore: Map<number, PendingPreorderDTO[]>
  selectedStops: SelectedStop[]
  onToggle: (store: MapStoreDTO) => void
  search: string
  onSearchChange: (value: string) => void
  filter: 'todas' | 'con_pedido' | 'sin_pedido' | 'red' | 'yellow' | 'green'
  onFilterChange: (value: 'todas' | 'con_pedido' | 'sin_pedido' | 'red' | 'yellow' | 'green') => void
  preorderDate: string
  onPreorderDateChange: (value: string) => void
  preorderTime: 'todos' | 'MAÑANA' | 'TARDE'
  onPreorderTimeChange: (value: 'todos' | 'MAÑANA' | 'TARDE') => void
}) {
  // "stores" ya viene filtrada desde el componente padre (mismo buscador +
  // filtro que se usa para decidir que marcadores se ven en el mapa), asi
  // que el mapa y esta lista siempre muestran exactamente las mismas tiendas.
  const orderByStore = new Map(selectedStops.map((s, i) => [s.id_store, i + 1]))

  const FILTERS: { value: typeof filter; label: string }[] = [
    { value: 'todas', label: 'Todas' },
    { value: 'con_pedido', label: 'Con pedido' },
    { value: 'sin_pedido', label: 'Sin pedido' },
    { value: 'red', label: 'Bajo mínimo' },
    { value: 'yellow', label: 'Cerca del mínimo' },
    { value: 'green', label: 'Bien surtida' },
  ]

  return (
    <div className="w-[340px] shrink-0 rounded-xl border border-border bg-white p-4 overflow-y-auto">
      {selectedStops.length > 0 && (
        <div className="mb-4 pb-4 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            Orden de la ruta ({selectedStops.length})
          </p>
          <ul className="space-y-1.5">
            {selectedStops.map((s, i) => (
              <li key={s.id_store} className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-success text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                {s.semaphore && <span className={`w-2 h-2 rounded-full shrink-0 ${SEMAPHORE_DOT_MAP[s.semaphore]}`} />}
                <span className="flex-1 truncate">{s.store_name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
          Pedidos con entrega para...
        </p>
        <div className="flex gap-2">
          <Input
            type="date"
            value={preorderDate}
            onChange={(e) => onPreorderDateChange(e.target.value)}
            className="flex-1"
          />
          <select
            value={preorderTime}
            onChange={(e) => onPreorderTimeChange(e.target.value as any)}
            className="text-sm rounded-lg border border-border px-2 bg-white"
          >
            <option value="todos">Mañana y tarde</option>
            <option value="MAÑANA">Solo mañana</option>
            <option value="TARDE">Solo tarde</option>
          </select>
        </div>
        {preorderDate && (
          <button
            type="button"
            onClick={() => { onPreorderDateChange(''); onPreorderTimeChange('todos') }}
            className="text-xs underline text-muted-foreground/70 mt-1"
          >
            Quitar filtro de fecha
          </button>
        )}
      </div>

      <Input
        placeholder="Buscar tienda..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="mb-2"
      />
      <div className="flex flex-wrap gap-1 mb-3">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => onFilterChange(f.value)}
            className={`text-xs px-2 py-1 rounded-md border transition-colors ${filter === f.value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
        Tiendas ({stores.length})
      </p>
      {stores.length === 0 ? (
        <p className="text-sm text-muted-foreground/70">No hay tiendas que coincidan.</p>
      ) : (
        <ul className="space-y-2">
          {stores.map((store) => {
            const order = orderByStore.get(store.id_store)
            const hasPending = pendingByStore.has(store.id_store)
            return (
              <li key={store.id_store}>
                <button
                  type="button"
                  onClick={() => onToggle(store)}
                  className={`w-full text-left rounded-lg border-2 px-3 py-2 transition-colors ${order ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 min-w-0">
                      {store.semaphore && <span className={`w-2 h-2 rounded-full shrink-0 ${SEMAPHORE_DOT_MAP[store.semaphore]}`} />}
                      <span className="text-sm font-medium truncate">{store.name}</span>
                    </span>
                    {order && (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">{order}</span>
                    )}
                  </div>
                  {hasPending && (
                    <p className="text-xs text-warning-foreground dark:text-warning mt-0.5">Tiene pedido pendiente</p>
                  )}
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
          Historial de entregas
        </p>
        <StoreDeliveryHistory idStore={store.id_store} />
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
