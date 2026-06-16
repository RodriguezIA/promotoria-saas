import { Store } from "lucide-react"
import { OverlayView } from "@react-google-maps/api"


import { CustomMarkerProps } from '../utils'


export function CustomMarker({ position, imageUrl, storeName }: CustomMarkerProps) {
    // Dimensiones fijas del marcador
    const MARKER_WIDTH = 120;
    const MARKER_HEIGHT = 130; // Altura total hasta el punto

    return (
        <OverlayView
            position={position}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={() => ({
                x: -(MARKER_WIDTH / 2), // Centrar horizontalmente
                y: -MARKER_HEIGHT,       // El punto queda exactamente en las coordenadas
            })}
        >
            <div className="relative" style={{ width: MARKER_WIDTH }}>
                {/* Contenedor del marcador */}
                <div className="bg-white rounded-lg shadow-lg border-2 border-brand overflow-hidden">
                    {/* Imagen */}
                    <div className="w-full h-[70px] bg-muted relative">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={storeName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Store size={28} className="text-muted-foreground/50" />
                            </div>
                        )}
                    </div>
                    
                    {/* Nombre */}
                    <div className="px-2 py-1.5 text-center">
                        <p className="text-xs font-medium text-foreground truncate">
                            {storeName || "Nuevo establecimiento"}
                        </p>
                    </div>
                </div>

                {/* Flecha hacia abajo */}
                <div 
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{ top: '100%' }}
                >
                    <div 
                        className="w-0 h-0"
                        style={{
                            borderLeft: '10px solid transparent',
                            borderRight: '10px solid transparent',
                            borderTop: '12px solid var(--brand)',
                        }}
                    />
                </div>

                {/* Punto de ubicación - ESTE ES EL ANCLA */}
                <div 
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{ top: 'calc(100% + 10px)' }}
                >
                    <div className="w-3 h-3 bg-brand rounded-full border-2 border-white shadow-md" />
                </div>
            </div>
        </OverlayView>
    );
}