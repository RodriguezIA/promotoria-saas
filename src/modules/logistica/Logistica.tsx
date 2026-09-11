import { useState } from "react"
import { Route as RouteIcon, Map, ListChecks } from "lucide-react"

import { PageWrapper, PageHeader } from "@/components"
import Mapa from "@/modules/mapa/Mapa"
import CrearRuta from "./CrearRuta"
import RutasCreadas from "./RutasCreadas"

type Tab = "crear" | "organizar" | "creadas"

const TABS: { id: Tab; label: string; icon: typeof RouteIcon }[] = [
  { id: "crear", label: "Crear Ruta", icon: RouteIcon },
  { id: "organizar", label: "Organizar Ruta", icon: Map },
  { id: "creadas", label: "Rutas Creadas", icon: ListChecks },
]

export default function Logistica() {
  const [tab, setTab] = useState<Tab>("organizar")

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex gap-2 border-b border-border">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          )
        })}
      </div>

      {tab === "crear" && <CrearRuta />}
      {tab === "organizar" && <Mapa />}
      {tab === "creadas" && (
        <PageWrapper>
          <PageHeader title="Rutas Creadas" subtitle="Historial de rutas que ya organizaste, con su chofer y la última vez que se usaron" />
          <RutasCreadas />
        </PageWrapper>
      )}
    </div>
  )
}
