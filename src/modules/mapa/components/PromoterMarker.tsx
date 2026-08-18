import { OverlayView } from "@react-google-maps/api"

import { MapActivePromoterDTO } from '@/dtos'

interface PromoterMarkerProps {
    promoter: MapActivePromoterDTO
    storeName: string
}

export function PromoterMarker({ promoter, storeName }: PromoterMarkerProps) {
    const SIZE = 18

    return (
        <OverlayView
            position={{ lat: promoter.latitude, lng: promoter.longitude }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={() => ({ x: -(SIZE / 2), y: -(SIZE / 2) })}
        >
            <div
                className="rounded-full bg-info border-2 border-white shadow-md animate-pulse"
                style={{ width: SIZE, height: SIZE }}
                title={`${promoter.name} — activo en ${storeName}`}
            />
        </OverlayView>
    )
}
