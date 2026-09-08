import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { GoogleMap, OverlayView } from '@react-google-maps/api'
import { Loader2 } from 'lucide-react'

import { useJsApiLoader, GOOGLE_MAPS_CONFIG } from '@/lib'
import { getMyRoutes, updateDriverLocation, DriverRouteStopDTO } from '@/Fetch/driverPanel'
import { StopHistorialDialog } from './StopHistorialDialog'

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' }
const DEFAULT_CENTER = { lat: 25.7460, lng: -100.2792 }

export default function RutaMapa() {
  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_CONFIG)
  const [stops, setStops] = useState<DriverRouteStopDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStop, setSelectedStop] = useState<DriverRouteStopDTO | null>(null)

  useEffect(() => {
    setLoading(true)
    getMyRoutes()
      .then((res) => {
        const today = new Date().toISOString().slice(0, 10)
        const todaysStops = res.data
          .filter((r) => r.route_date.slice(0, 10) === today)
          .flatMap((r) => r.stops)
        setStops(todaysStops)
      })
      .catch(() => toast.error('Error al cargar tu ruta'))
      .finally(() => setLoading(false))

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => updateDriverLocation(pos.coords.latitude, pos.coords.longitude).catch(() => {}),
        () => {},
      )
    }
  }, [])

  const stopsWithCoords = stops.filter((s) => s.store.address?.latitude && s.store.address?.longitude)

  const mapCenter = useMemo(() => {
    if (stopsWithCoords.length === 0) return DEFAULT_CENTER
    const lat = stopsWithCoords.reduce((sum, s) => sum + (s.store.address!.latitude ?? 0), 0) / stopsWithCoords.length
    const lng = stopsWithCoords.reduce((sum, s) => sum + (s.store.address!.longitude ?? 0), 0) / stopsWithCoords.length
    return { lat, lng }
  }, [stopsWithCoords])

  const handleStopUpdated = (updated: DriverRouteStopDTO) => {
    setStops((prev) => prev.map((s) => (s.id_stop === updated.id_stop ? { ...s, ...updated } : s)))
  }

  return (
    <div className="h-[calc(100vh-4rem)] relative">
      {(loading || !isLoaded) && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      )}
      {isLoaded && (
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={mapCenter}
          zoom={stopsWithCoords.length > 0 ? 12 : 6}
        >
          {stopsWithCoords.map((stop) => (
            <OverlayView
              key={stop.id_stop}
              position={{ lat: stop.store.address!.latitude!, lng: stop.store.address!.longitude! }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              getPixelPositionOffset={() => ({ x: -20, y: -20 })}
            >
              <button
                type="button"
                onClick={() => setSelectedStop(stop)}
                className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-white font-bold border-2 border-white"
                style={{ backgroundColor: stop.i_status === 1 ? '#2F7654' : '#C18434' }}
                title={stop.store.name}
              >
                {stop.i_order}
              </button>
            </OverlayView>
          ))}
        </GoogleMap>
      )}
      {!loading && stops.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <p className="text-sm text-muted-foreground">No tienes tiendas asignadas para hoy.</p>
        </div>
      )}

      <StopHistorialDialog
        stop={selectedStop}
        open={!!selectedStop}
        onOpenChange={(open) => !open && setSelectedStop(null)}
        onUpdated={handleStopUpdated}
      />
    </div>
  )
}
