import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'

import { api, ApiResponse } from '@/lib'
import { useAuthStore } from '@/stores'
import {
  PageWrapper,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Input,
  Button,
  Card,
  CardContent,
} from '@/components'
import { channelSalesDTO, ProductDTO, StateDTO, CityDTO } from '@/dtos'
import { getProductsByClient } from '@/Fetch/products'
import { bulkAssignStockMinimum, getStockMatchingStores, MatchingStoreDTO } from '@/Fetch/stock'

const FILTRO_TODOS = 'todos'
const DEFAULT_COUNTRY_ID = 1

export default function AsignarMinimos() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const idClient = user?.id_client && user.id_client > 0 ? user.id_client : undefined

  const [products, setProducts] = useState<ProductDTO[]>([])
  const [channels, setChannels] = useState<channelSalesDTO[]>([])
  const [states, setStates] = useState<StateDTO[]>([])
  const [cities, setCities] = useState<CityDTO[]>([])

  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [selectedChannels, setSelectedChannels] = useState<number[]>([])
  const [estado, setEstado] = useState(FILTRO_TODOS)
  const [selectedMunicipios, setSelectedMunicipios] = useState<number[]>([])
  const [minimum, setMinimum] = useState('')

  const [matchingCount, setMatchingCount] = useState<number | null>(null)
  const [matchingStores, setMatchingStores] = useState<MatchingStoreDTO[]>([])
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([])
  const [loadingCount, setLoadingCount] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastResult, setLastResult] = useState<{ stores_affected: number; assignments: number } | null>(null)

  useEffect(() => {
    if (idClient) {
      getProductsByClient(idClient)
        .then((res: ApiResponse<ProductDTO[]>) => setProducts(res.data))
        .catch(() => toast.error('Error al cargar tus productos'))
    }
  }, [idClient])

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
      setSelectedMunicipios([])
      return
    }
    api.get<ApiResponse<CityDTO[]>>(`/clients/cities/${estado}`)
      .then((res) => setCities(res.data))
      .catch(() => toast.error('Error al cargar los municipios'))
  }, [estado])

  const filterPayload = useMemo(() => ({
    id_channels: selectedChannels.length > 0 ? selectedChannels : undefined,
    id_state: estado !== FILTRO_TODOS ? Number(estado) : undefined,
    id_municipios: selectedMunicipios.length > 0 ? selectedMunicipios : undefined,
  }), [selectedChannels, estado, selectedMunicipios])

  useEffect(() => {
    setLoadingCount(true)
    getStockMatchingStores({ ...filterPayload, id_products: selectedProducts })
      .then((res) => {
        setMatchingStores(res.data)
        setMatchingCount(res.data.length)
        // Por default se seleccionan todas las que coinciden con el filtro;
        // el cliente puede destildar las que no quiera tocar antes de aplicar.
        setSelectedStoreIds(res.data.map((s) => s.id_store))
      })
      .catch(() => { setMatchingStores([]); setMatchingCount(null); setSelectedStoreIds([]) })
      .finally(() => setLoadingCount(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterPayload, selectedProducts])

  const toggleStoreSelection = (id: number) => {
    setSelectedStoreIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
  }

  const selectAllStores = () => setSelectedStoreIds(matchingStores.map((s) => s.id_store))
  const deselectAllStores = () => setSelectedStoreIds([])

  const toggleProduct = (id: number) => {
    setSelectedProducts((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id])
  }

  const toggleChannel = (id: number) => {
    setSelectedChannels((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id])
  }

  const toggleMunicipio = (id: number) => {
    setSelectedMunicipios((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id])
  }

  const canSubmit = selectedProducts.length > 0 && selectedStoreIds.length > 0 && minimum !== '' && !Number.isNaN(Number(minimum)) && Number(minimum) >= 0

  const refreshMatchingStores = () => {
    setLoadingCount(true)
    getStockMatchingStores({ ...filterPayload, id_products: selectedProducts })
      .then((res) => {
        setMatchingStores(res.data)
        setMatchingCount(res.data.length)
        setSelectedStoreIds(res.data.map((s) => s.id_store))
      })
      .catch(() => { setMatchingStores([]); setMatchingCount(null); setSelectedStoreIds([]) })
      .finally(() => setLoadingCount(false))
  }

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error('Selecciona al menos un producto, una tienda, y un mínimo válido')
      return
    }
    setSaving(true)
    setLastResult(null)
    try {
      const res = await bulkAssignStockMinimum({
        id_stores: selectedStoreIds,
        id_products: selectedProducts,
        i_minimum: Number(minimum),
      })
      setLastResult(res.data)
      toast.success(`Mínimo asignado en ${res.data.stores_affected} tienda(s)`)
      refreshMatchingStores()
    } catch {
      toast.error('Error al asignar los mínimos')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Asignar mínimos por lote"
        subtitle="Ponle el mismo mínimo de piezas a varios productos, en muchas tiendas a la vez, sin entrar una por una"
      />

      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate('/mapa')}>
        <ArrowLeft size={16} className="mr-1" /> Volver al mapa
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">
        {/* Productos */}
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-semibold text-foreground mb-1">1. ¿Qué productos?</h3>
            <p className="text-xs text-muted-foreground mb-3">Puedes elegir uno o varios.</p>
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground/70">No hay productos.</p>
              ) : (
                products.map((p) => (
                  <label
                    key={p.id_product}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedProducts.includes(p.id_product)}
                      onCheckedChange={() => toggleProduct(p.id_product)}
                    />
                    <span className="text-sm">{p.name}</span>
                  </label>
                ))
              )}
            </div>

            <h3 className="font-semibold text-foreground mt-5 mb-1">2. ¿Cuál es el mínimo?</h3>
            <Input
              type="number"
              min={0}
              value={minimum}
              onChange={(e) => setMinimum(e.target.value)}
              placeholder="Ej. 10 piezas"
              className="w-40"
            />
          </CardContent>
        </Card>

        {/* Zonas / tiendas */}
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-semibold text-foreground mb-1">3. ¿En qué tiendas?</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Deja algo sin marcar para incluir "todas" en ese nivel. Ej: solo cadena + estado aplica a todas las
              tiendas de esa cadena en ese estado.
            </p>

            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 mt-3">Cadenas</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {channels.map((c) => (
                <label
                  key={c.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm cursor-pointer ${
                    selectedChannels.includes(c.id) ? 'bg-info/10 border-info/30 text-info' : 'border-border'
                  }`}
                >
                  <Checkbox
                    checked={selectedChannels.includes(c.id)}
                    onCheckedChange={() => toggleChannel(c.id)}
                  />
                  {c.name}
                </label>
              ))}
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Estado</p>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger className="w-full mb-3">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTRO_TODOS}>Todos los estados</SelectItem>
                {states.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {estado !== FILTRO_TODOS && cities.length > 0 && (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                  Municipios (opcional — vacío = todo el estado)
                </p>
                <div className="flex flex-wrap gap-2 mb-3 max-h-32 overflow-y-auto">
                  {cities.map((c) => (
                    <label
                      key={c.id}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm cursor-pointer ${
                        selectedMunicipios.includes(c.id) ? 'bg-info/10 border-info/30 text-info' : 'border-border'
                      }`}
                    >
                      <Checkbox
                        checked={selectedMunicipios.includes(c.id)}
                        onCheckedChange={() => toggleMunicipio(c.id)}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </>
            )}

            <div className="mt-4 p-3 rounded-lg bg-muted/40">
              <div className="flex items-center justify-between gap-2 text-sm mb-2">
                {loadingCount ? (
                  <Loader2 size={14} className="animate-spin text-muted-foreground" />
                ) : (
                  <span>
                    <span className="font-bold text-foreground">{selectedStoreIds.length}</span>
                    <span className="text-muted-foreground"> de {matchingCount ?? 0} tienda(s) seleccionada(s)</span>
                  </span>
                )}
                {matchingStores.length > 0 && (
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={selectAllStores} className="text-xs text-info hover:underline">
                      Todas
                    </button>
                    <button type="button" onClick={deselectAllStores} className="text-xs text-muted-foreground hover:underline">
                      Ninguna
                    </button>
                  </div>
                )}
              </div>

              {matchingStores.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {matchingStores.map((s) => {
                    const hasSelection = selectedProducts.length > 0
                    const complete = hasSelection && s.products_with_minimum === s.products_total
                    const partial = hasSelection && s.products_with_minimum > 0 && !complete
                    const checked = selectedStoreIds.includes(s.id_store)
                    return (
                      <label
                        key={s.id_store}
                        className={`flex items-center gap-2 text-xs bg-white rounded-md px-2.5 py-1.5 border cursor-pointer ${
                          checked ? 'border-border/60' : 'border-border/30 opacity-50'
                        }`}
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggleStoreSelection(s.id_store)} />
                        <span className="truncate flex-1">
                          {s.name}
                          {s.municipio_name && <span className="text-muted-foreground"> · {s.municipio_name}</span>}
                        </span>
                        {hasSelection && (
                          <span
                            className={`shrink-0 px-1.5 py-0.5 rounded font-medium ${
                              complete
                                ? 'bg-success/10 text-success'
                                : partial
                                ? 'bg-warning/10 text-warning'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {complete
                              ? 'Ya tiene mínimo'
                              : partial
                              ? `${s.products_with_minimum}/${s.products_total} con mínimo`
                              : 'Sin mínimo aún'}
                          </span>
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-5xl mt-5 flex items-center gap-3">
        <Button onClick={handleSubmit} disabled={!canSubmit || saving}>
          {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
          Asignar mínimo a {selectedStoreIds.length} tienda(s)
        </Button>
        {lastResult && (
          <span className="flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2 size={16} />
            Se aplicó a {lastResult.stores_affected} tienda(s) ({lastResult.assignments} asignaciones)
          </span>
        )}
      </div>
    </PageWrapper>
  )
}
