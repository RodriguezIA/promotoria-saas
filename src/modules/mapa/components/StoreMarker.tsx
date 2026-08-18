import { Store as StoreIcon } from "lucide-react"
import { OverlayView } from "@react-google-maps/api"

import { MapStoreDTO } from '@/dtos'

const SEMAPHORE_COLOR: Record<string, string> = {
    red: '#BA3E38',
    yellow: '#C18434',
    green: '#2F7654',
}

interface StoreMarkerProps {
    store: MapStoreDTO
    onClick: () => void
    selected: boolean
}

export function StoreMarker({ store, onClick, selected }: StoreMarkerProps) {
    const MARKER_SIZE = 52
    const borderColor = store.semaphore ? SEMAPHORE_COLOR[store.semaphore] : '#9CA3AF'

    return (
        <OverlayView
            position={{ lat: store.latitude, lng: store.longitude }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={() => ({ x: -(MARKER_SIZE / 2), y: -(MARKER_SIZE / 2) })}
        >
            <button
                type="button"
                onClick={onClick}
                className="relative cursor-pointer transition-transform"
                style={{ width: MARKER_SIZE, height: MARKER_SIZE, transform: selected ? 'scale(1.15)' : 'scale(1)' }}
                title={store.name}
            >
                <div
                    className="w-full h-full rounded-full bg-white shadow-lg overflow-hidden flex items-center justify-center"
                    style={{ border: `3px solid ${borderColor}` }}
                >
                    {store.channel?.logo ? (
                        <img src={store.channel.logo} alt={store.channel.name} className="w-full h-full object-cover" />
                    ) : (
                        <StoreIcon size={22} className="text-muted-foreground/60" />
                    )}
                </div>
                {store.active_promoters.length > 0 && (
                    <span
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-info text-white text-[10px] font-bold flex items-center justify-center border-2 border-white"
                        title={`${store.active_promoters.length} promotor(es) activo(s)`}
                    >
                        {store.active_promoters.length}
                    </span>
                )}
            </button>
        </OverlayView>
    )
}
