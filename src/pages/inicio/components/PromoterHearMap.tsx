import { useRef } from "react";
import { Loader2, MapPin } from "lucide-react";
import { GoogleMap } from "@react-google-maps/api";

import { HeatmapPromoter } from '@/Fetch/inicio';
import { GOOGLE_MAPS_CONFIG, useJsApiLoader } from '@/lib'



const mapContainerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "8px",
};

interface Props {
  promoters: HeatmapPromoter[];
}


export function PromoterHeatMap({ promoters }: Props) {
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);

  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_CONFIG)

  const MAP_STYLE_GRAY: google.maps.MapTypeStyle[] = [
    { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e0e0e0" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9d8e8" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
    ];

    const MAP_STYLE_WHITE: google.maps.MapTypeStyle[] = [
    { elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#f3f3f3" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e8e8e8" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ebebeb" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#d6d6d6" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#dde8f0" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f9f9f9" }] },
    { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#e0e0e0" }] },
    ];


  // Centro del mapa: promedio de coordenadas
  const center = promoters.length > 0
    ? {
        lat: promoters.reduce((s, p) => s + Number(p.f_latitude), 0) / promoters.length,
        lng: promoters.reduce((s, p) => s + Number(p.f_longitude), 0) / promoters.length,
      }
    : { lat: 25.6866, lng: -100.3161 }; // Monterrey por defecto

  const onMapLoad = (map: google.maps.Map) => {
    const heatmapData = promoters.map(
      (p) => new google.maps.LatLng(Number(p.f_latitude), Number(p.f_longitude))
    );

    heatmapRef.current = new google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      radius: 40,
      opacity: 0.8,
      gradient: [
        "rgba(0, 255, 255, 0)",
        "rgba(0, 255, 255, 1)",
        "rgba(0, 191, 255, 1)",
        "rgba(0, 127, 255, 1)",
        "rgba(0, 63, 255, 1)",
        "rgba(0, 0, 255, 1)",
        "rgba(0, 0, 223, 1)",
        "rgba(0, 0, 191, 1)",
        "rgba(0, 0, 159, 1)",
        "rgba(0, 0, 127, 1)",
        "rgba(63, 0, 91, 1)",
        "rgba(127, 0, 63, 1)",
        "rgba(191, 0, 31, 1)",
        "rgba(255, 0, 0, 1)",
      ],
    });

    heatmapRef.current.setMap(map);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin size={20} className="text-gray-600" />
          <h2 className="text-lg font-medium">Mapa de Calor — Actividad de Promotores</h2>
        </div>
        <span className="text-sm text-gray-500">
          {promoters.length > 0 ? `${promoters.length} promotores con ubicación` : "Sin ubicaciones registradas aún"}
        </span>
      </div>

      {isLoaded ? (
        promoters.length > 0 ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={11}
            onLoad={onMapLoad}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
              styles: MAP_STYLE_GRAY,
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg gap-3" style={{ height: 500 }}>
            <MapPin className="w-10 h-10 text-gray-300" />
            <p className="text-sm text-gray-400 font-medium">Sin ubicaciones registradas</p>
            <p className="text-xs text-gray-400 text-center max-w-xs">
              Las ubicaciones aparecerán aquí cuando los promotores actualicen su posición desde la app móvil.
            </p>
          </div>
        )
      ) : (
        <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height: 500 }}>
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  );
}