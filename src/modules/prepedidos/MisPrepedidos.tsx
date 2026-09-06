import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Store, Calendar, Sun, Moon, User, ExternalLink } from "lucide-react"

import { useAuthStore } from "@/stores"
import { PageWrapper, PageHeader, Badge } from "@/components"
import { getPreordersByClient, PreorderDTO } from "@/Fetch/preorder"

const TIME_LABEL: Record<string, string> = { MAÑANA: 'Por la mañana', TARDE: 'Por la tarde' }

export default function MisPrepedidos() {
  const { user } = useAuthStore()
  const [preorders, setPreorders] = useState<PreorderDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id_client) return
    setLoading(true)
    getPreordersByClient(user.id_client)
      .then((res) => setPreorders(res.data))
      .catch(() => toast.error("Error al cargar tus prepedidos"))
      .finally(() => setLoading(false))
  }, [user?.id_client])

  return (
    <PageWrapper>
      <PageHeader
        title="Mis Prepedidos"
        subtitle="Pedidos que tus promotores levantaron con los encargados de tienda por faltantes de inventario"
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      ) : preorders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          Todavía no hay ningún prepedido levantado.
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {preorders.map((p) => (
            <div key={p.id_preorder} className="rounded-xl border border-border bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Store size={18} className="text-muted-foreground" />
                  <span className="font-bold text-foreground">{p.task.store.name}</span>
                  {p.task.vc_folio && (
                    <Badge variant="outline" className="text-xs">{p.task.vc_folio}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar size={14} />
                    {new Date(p.preferred_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    {p.preferred_time === 'MAÑANA' ? <Sun size={14} /> : <Moon size={14} />}
                    {TIME_LABEL[p.preferred_time]}
                  </span>
                </div>
              </div>

              {p.task.promoter && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
                  <User size={12} /> Levantado por {p.task.promoter.name} {p.task.promoter.lastname ?? ''}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {p.items.map((item) => (
                  <div key={item.id_item} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <span className="font-bold text-foreground">{item.i_quantity}</span>{' '}
                    <span className="text-muted-foreground">{item.product.name}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs text-muted-foreground">
                <span>WhatsApp del encargado: {p.manager_whatsapp}</span>
                <a
                  href={p.manager_signature}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  Ver firma <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
