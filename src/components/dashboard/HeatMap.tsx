import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface PromoterLocation {
  id: number;
  lat: number;
  lng: number;
  name: string;
  active: boolean;
}

interface HeatMapProps {
  promoters: PromoterLocation[];
}

export function HeatMap({ promoters }: HeatMapProps) {
  const activePromoters = promoters.filter(p => p.active);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Mapa de Promotores Activos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-10 h-10 mb-2 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground ">
                Mapa de calor de promotores activos
              </p>
              <p className="text-xs text-muted-foreground 0 mt-1">
                {activePromoters.length} promotores activos en el mapa
              </p>
            </div>
          </div>

          <svg className="w-full h-full absolute inset-0" xmlns="http://www.w3.org/2000/svg">
            {activePromoters.map((promoter, index) => {
              const x = ((promoter.lng + 180) / 360) * 100;
              const y = ((90 - promoter.lat) / 180) * 100;
              const opacity = 0.3 + (Math.random() * 0.4);

              return (
                <g key={promoter.id}>
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="20"
                    fill="rgba(59, 130, 246, 0.1)"
                    className="animate-pulse"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  />
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="8"
                    fill={`rgba(59, 130, 246, ${opacity})`}
                  />
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="3"
                    fill="rgb(37, 99, 235)"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-semibold text-foreground">{activePromoters.length}</div>
            <div className="text-xs text-muted-foreground">Activos ahora</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-foreground">{promoters.length}</div>
            <div className="text-xs text-muted-foreground">Total promotores</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-foreground">
              {Math.round((activePromoters.length / promoters.length) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Tasa de actividad</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-foreground">
              {Math.floor(Math.random() * 50 + 20)}
            </div>
            <div className="text-xs text-muted-foreground">Zonas cubiertas</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
