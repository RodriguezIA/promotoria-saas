import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft, MapPin } from 'lucide-react'

import { Button, Input, Label, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components'
import {
  getDriverStates,
  getDriverCities,
  getDriverChannels,
  createDriverStore,
  DriverStateDTO,
  DriverCityDTO,
  DriverChannelDTO,
} from '@/Fetch/driverPanel'

const MEXICO_ID = 1

export default function NuevaTienda() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [storeCode, setStoreCode] = useState('')
  const [channels, setChannels] = useState<DriverChannelDTO[]>([])
  const [idChannel, setIdChannel] = useState('')
  const [states, setStates] = useState<DriverStateDTO[]>([])
  const [idState, setIdState] = useState('')
  const [cities, setCities] = useState<DriverCityDTO[]>([])
  const [idCity, setIdCity] = useState('')
  const [street, setStreet] = useState('')
  const [extNumber, setExtNumber] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getDriverChannels().then((res) => setChannels(res.data)).catch(() => {})
    getDriverStates(MEXICO_ID).then((res) => setStates(res.data)).catch(() => toast.error('Error al cargar los estados'))
  }, [])

  useEffect(() => {
    if (!idState) { setCities([]); setIdCity(''); return }
    getDriverCities(Number(idState)).then((res) => setCities(res.data)).catch(() => toast.error('Error al cargar los municipios'))
  }, [idState])

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast.error('Tu dispositivo no soporta ubicación')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
        toast.success('Ubicación capturada')
      },
      () => {
        toast.error('No se pudo obtener tu ubicación')
        setLocating(false)
      }
    )
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Ponle un nombre a la tienda')
      return
    }
    if (!idState || !idCity) {
      toast.error('Selecciona el estado y el municipio')
      return
    }
    setSaving(true)
    try {
      await createDriverStore({
        name: name.trim(),
        id_channel_sale: idChannel ? Number(idChannel) : undefined,
        store_code: storeCode.trim() || undefined,
        id_state: Number(idState),
        id_city: Number(idCity),
        street: street.trim() || undefined,
        ext_number: extNumber.trim() || undefined,
        postal_code: postalCode.trim() || undefined,
        latitude: coords ? String(coords.lat) : undefined,
        longitude: coords ? String(coords.lng) : undefined,
      })
      toast.success('Tienda dada de alta')
      navigate(-1)
    } catch (e: any) {
      toast.error(e?.message || 'Error al dar de alta la tienda')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      <div className="sticky top-0 bg-white border-b border-border p-3 flex items-center gap-2 z-10">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-foreground">Nueva tienda</h1>
      </div>

      <div className="flex-1 p-4 space-y-4 pb-24">
        <div>
          <Label>Nombre de la tienda *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. OXXO Centro" />
        </div>

        <div>
          <Label>Canal de venta</Label>
          <Select value={idChannel} onValueChange={setIdChannel}>
            <SelectTrigger><SelectValue placeholder="Selecciona un canal" /></SelectTrigger>
            <SelectContent>
              {channels.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Código de tienda (opcional)</Label>
          <Input value={storeCode} onChange={(e) => setStoreCode(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Estado *</Label>
            <Select value={idState} onValueChange={setIdState}>
              <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Municipio *</Label>
            <Select value={idCity} onValueChange={setIdCity} disabled={!idState}>
              <SelectTrigger><SelectValue placeholder="Municipio" /></SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Calle (opcional)</Label>
          <Input value={street} onChange={(e) => setStreet(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Número (opcional)</Label>
            <Input value={extNumber} onChange={(e) => setExtNumber(e.target.value)} />
          </div>
          <div>
            <Label>Código postal (opcional)</Label>
            <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Ubicación GPS</Label>
          <Button type="button" variant="outline" className="w-full" onClick={handleLocate} disabled={locating}>
            {locating ? <Loader2 size={14} className="mr-2 animate-spin" /> : <MapPin size={14} className="mr-2" />}
            {coords ? 'Ubicación capturada — tocar para actualizar' : 'Usar mi ubicación actual'}
          </Button>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-border p-3">
        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
          Dar de alta
        </Button>
      </div>
    </div>
  )
}
