import { Home } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components"

export function Maintenance() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-md flex flex-col items-center text-center">
        <img
          src="/images/pagina_en_mantenimiento.svg"
          alt="Página en mantenimiento"
          className="w-full max-w-sm mb-8"
        />

        <div className="flex items-center gap-2 mb-3">
          <span className="h-[3px] w-7 rounded-full bg-brand" aria-hidden />
          <span className="font-mono text-xs tracking-[0.14em] uppercase text-muted-foreground">
            En mantenimiento
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight font-display text-foreground">
          Estamos trabajando en esto
        </h1>
        <p className="text-sm mt-2 text-muted-foreground max-w-prose">
          Esta sección está en mantenimiento por el momento. Vuelve pronto, ya casi está lista.
        </p>

        <div className="flex items-center gap-3 mt-6">
          <Button onClick={() => navigate("/")} className="flex items-center gap-2">
            <Home size={16} /> Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
