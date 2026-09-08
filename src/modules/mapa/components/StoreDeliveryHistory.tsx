import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { getStoreDeliveryHistory, StoreDeliveryHistoryDTO } from '@/Fetch/delivery-routes'

const money = (n: number) => `$${n.toFixed(2)}`

export function StoreDeliveryHistory({ idStore }: { idStore: number }) {
  const [data, setData] = useState<StoreDeliveryHistoryDTO | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getStoreDeliveryHistory(idStore)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [idStore])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 size={16} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data || data.visits.length === 0) {
    return <p className="text-sm text-muted-foreground/70">Esta tienda todavía no tiene entregas registradas.</p>
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-muted/40 p-3">
        <p className="text-xs text-muted-foreground mb-1">Total entregado a esta tienda</p>
        <p className="text-lg font-bold text-foreground">{money(data.total_charged)}</p>
        {data.totals_by_product.length > 0 && (
          <div className="mt-2 space-y-0.5">
            {data.totals_by_product.map((p, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                <span className="font-semibold">{p.quantity}</span> {p.name} en total
              </p>
            ))}
          </div>
        )}
      </div>

      <ul className="space-y-1.5">
        {data.visits.map((v) => (
          <li key={v.id_stop} className="text-sm border-b border-border/60 pb-1.5 last:border-0">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {v.dt_visited ? new Date(v.dt_visited).toLocaleDateString('es-MX') : '—'} · {v.route.driver.name}
              </span>
              <span className="font-semibold">{money(Number(v.f_total_charged ?? 0))}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {v.b_consigna
                ? 'A consignación'
                : [
                    v.f_amount_cash ? `Efectivo ${money(Number(v.f_amount_cash))}` : null,
                    v.f_amount_transfer ? `Transferencia ${money(Number(v.f_amount_transfer))}` : null,
                  ].filter(Boolean).join(' · ')}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
