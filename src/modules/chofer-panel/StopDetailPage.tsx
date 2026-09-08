import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2, ArrowLeft, PackageCheck, PackageX, Store as StoreIcon } from 'lucide-react'

import { Button, Input, Label, Textarea, Checkbox, Badge } from '@/components'
import {
  getMyRoutes,
  updateStop,
  getDriverProducts,
  getDriverStoreMinimums,
  DriverRouteStopDTO,
  DriverProductDTO,
  DriverStoreMinimumDTO,
} from '@/Fetch/driverPanel'
import { useDriverAuthStore } from '@/stores/driverAuthStore'

const money = (n: number) => `$${n.toFixed(2)}`

export default function StopDetailPage() {
  const { id_stop } = useParams()
  const navigate = useNavigate()
  const driver = useDriverAuthStore((s) => s.driver)

  const [stop, setStop] = useState<DriverRouteStopDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<DriverProductDTO[]>([])
  const [minimums, setMinimums] = useState<DriverStoreMinimumDTO[]>([])

  const [delivered, setDelivered] = useState<boolean | null>(null)
  const [reason, setReason] = useState('')
  const [quantities, setQuantities] = useState<Record<number, string>>({})
  const [isConsigna, setIsConsigna] = useState(false)
  const [cashAmount, setCashAmount] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!driver || !id_stop) return
    setLoading(true)
    getMyRoutes()
      .then(async (res) => {
        const allStops = res.data.flatMap((r) => r.stops)
        const found = allStops.find((s) => s.id_stop === Number(id_stop))
        if (!found) {
          toast.error('No se encontró esta parada')
          navigate('/chofer/lista')
          return
        }
        setStop(found)

        const [productsRes, minimumsRes] = await Promise.all([
          getDriverProducts(driver.id_client),
          getDriverStoreMinimums(found.id_store),
        ])
        setProducts(productsRes.data)
        setMinimums(minimumsRes.data)

        if (found.preorder) {
          const initial: Record<number, string> = {}
          found.preorder.items.forEach((item) => {
            const match = productsRes.data.find((p) => p.name === item.product.name)
            if (match) initial[match.id_product] = String(item.i_quantity)
          })
          setQuantities(initial)
        }
      })
      .catch(() => toast.error('Error al cargar la parada'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver, id_stop])

  const minimumByProduct = useMemo(
    () => new Map(minimums.map((m) => [m.id_product, m.i_minimum])),
    [minimums]
  )
  const preorderByProductName = useMemo(() => {
    const map = new Map<string, number>()
    stop?.preorder?.items.forEach((item) => map.set(item.product.name, item.i_quantity))
    return map
  }, [stop])

  const total = useMemo(() => {
    return products.reduce((sum, p) => {
      const qty = Number(quantities[p.id_product] || 0)
      if (!qty) return sum
      return sum + qty * Number(p.f_store_price ?? 0)
    }, 0)
  }, [products, quantities])

  const handleSave = async () => {
    if (!stop) return
    if (delivered === null) {
      toast.error('Indica si se dejó o no la mercancía')
      return
    }
    if (!delivered && !reason.trim()) {
      toast.error('Indica por qué no se dejó la mercancía')
      return
    }
    const items = delivered
      ? Object.entries(quantities)
          .filter(([, qty]) => Number(qty) > 0)
          .map(([id_product, qty]) => ({ id_product: Number(id_product), quantity: Number(qty) }))
      : []
    if (delivered && items.length === 0) {
      toast.error('Pon cuánto vas a dejar de al menos un producto')
      return
    }
    if (delivered && !isConsigna && !cashAmount && !transferAmount) {
      toast.error('Indica cómo se cobró')
      return
    }
    if (delivered && !isConsigna) {
      const totalPaid = (Number(cashAmount) || 0) + (Number(transferAmount) || 0)
      if (totalPaid < total - 0.01) {
        toast.error(`Lo que pagaron (${money(totalPaid)}) es menor al total a cobrar (${money(total)}). Revisa las cantidades o el pago.`)
        return
      }
    }
    setSaving(true)
    try {
      await updateStop(stop.id_stop, {
        i_status: 1,
        b_delivered: delivered,
        vc_no_delivery_reason: delivered ? undefined : reason.trim(),
        b_consigna: delivered ? isConsigna : undefined,
        f_amount_cash: delivered && !isConsigna && cashAmount ? Number(cashAmount) : undefined,
        f_amount_transfer: delivered && !isConsigna && transferAmount ? Number(transferAmount) : undefined,
        items: delivered ? items : undefined,
      })
      toast.success('Visita registrada')

      // Si hay un numero de WhatsApp del encargado (viene del prepedido),
      // se le abre un mensaje ya redactado con el resumen de la entrega,
      // listo para que el chofer solo le de enviar.
      if (delivered && stop.preorder?.manager_whatsapp) {
        const now = new Date()
        const lines = [
          'TICKET DIGITAL DE VENTA',
          '',
          `Entrega registrada en ${stop.store.name}`,
          `Fecha: ${now.toLocaleDateString('es-MX')} ${now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`,
          '',
          'Productos entregados:',
          ...items.map((it) => {
            const p = products.find((prod) => prod.id_product === it.id_product)
            return `- ${it.quantity} ${p?.name ?? ''}`
          }),
          '',
          `Total: ${money(total)}`,
          isConsigna
            ? 'A consignación (no se cobró)'
            : [
                cashAmount ? `Efectivo: ${money(Number(cashAmount))}` : null,
                transferAmount ? `Transferencia: ${money(Number(transferAmount))}` : null,
              ].filter(Boolean).join(' · '),
        ]
        const phone = stop.preorder.manager_whatsapp.replace(/\D/g, '')
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`
        window.open(waUrl, '_blank')
      }

      navigate(-1)
    } catch (e: any) {
      toast.error(e?.message || 'Error al registrar la visita')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    )
  }

  if (!stop) return null

  const alreadyVisited = stop.i_status === 1

  return (
    <div className="min-h-full flex flex-col">
      <div className="sticky top-0 bg-white border-b border-border p-3 flex items-center gap-2 z-10">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-foreground truncate">{stop.store.name}</h1>
      </div>

      <div className="flex-1 p-4 space-y-4 pb-24">
        {alreadyVisited ? (
          <div className="rounded-lg border border-border p-3 space-y-2 text-sm">
            <Badge className={stop.b_delivered ? 'bg-success/10 text-success border-success/30' : 'bg-destructive/10 text-destructive border-destructive/30'}>
              {stop.b_delivered ? 'Se dejó mercancía' : 'No se dejó mercancía'}
            </Badge>
            {stop.b_delivered ? (
              <>
                <div className="space-y-0.5">
                  {stop.items?.map((item: any) => (
                    <p key={item.id_item} className="text-muted-foreground">
                      {item.i_quantity} {item.product.name}
                    </p>
                  ))}
                </div>
                <p className="font-semibold">Total: {money(Number(stop.f_total_charged ?? 0))}</p>
                {stop.b_consigna ? (
                  <p className="text-muted-foreground">A consignación</p>
                ) : (
                  <p className="text-muted-foreground">
                    {stop.f_amount_cash ? `Efectivo: ${money(Number(stop.f_amount_cash))}` : ''}
                    {stop.f_amount_cash && stop.f_amount_transfer ? ' · ' : ''}
                    {stop.f_amount_transfer ? `Transferencia: ${money(Number(stop.f_amount_transfer))}` : ''}
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Motivo: {stop.vc_no_delivery_reason}</p>
            )}
          </div>
        ) : (
          <>
            <div>
              <Label>¿Se dejó la mercancía?</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setDelivered(true)}
                  className={`rounded-lg border-2 p-3 flex flex-col items-center gap-1 text-sm ${delivered === true ? 'border-success bg-success/5' : 'border-border'}`}
                >
                  <PackageCheck size={18} className="text-success" /> Sí se dejó
                </button>
                <button
                  type="button"
                  onClick={() => setDelivered(false)}
                  className={`rounded-lg border-2 p-3 flex flex-col items-center gap-1 text-sm ${delivered === false ? 'border-destructive bg-destructive/5' : 'border-border'}`}
                >
                  <PackageX size={18} className="text-destructive" /> No se dejó
                </button>
              </div>
            </div>

            {delivered === true && (
              <>
                <div className="space-y-2">
                  {products.map((p) => {
                    const debeTener = minimumByProduct.get(p.id_product)
                    const prepedido = preorderByProductName.get(p.name)
                    if (debeTener === undefined && prepedido === undefined) return null
                    return (
                      <div key={p.id_product} className="rounded-lg border border-border p-3 flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                          {p.vc_image ? (
                            <img src={p.vc_image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <StoreIcon size={20} className="text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {debeTener !== undefined && `Debe tener: ${debeTener}`}
                            {debeTener !== undefined && prepedido !== undefined && ' · '}
                            {prepedido !== undefined && `Prepedido: ${prepedido}`}
                          </p>
                        </div>
                        <div className="shrink-0 text-center">
                          <Label className="text-[10px]">Voy a dejar</Label>
                          <Input
                            type="number"
                            min={0}
                            value={quantities[p.id_product] ?? ''}
                            onChange={(e) =>
                              setQuantities((prev) => ({ ...prev, [p.id_product]: e.target.value }))
                            }
                            className="w-16 h-9 text-center"
                          />
                        </div>
                      </div>
                    )
                  })}

                  {/* El resto del catalogo, por si deja algo que no estaba en el prepedido ni en los minimos */}
                  <details className="text-sm">
                    <summary className="text-muted-foreground cursor-pointer py-1">Ver todos los demás productos</summary>
                    <div className="space-y-2 mt-2">
                      {products
                        .filter((p) => minimumByProduct.get(p.id_product) === undefined && preorderByProductName.get(p.name) === undefined)
                        .map((p) => (
                          <div key={p.id_product} className="rounded-lg border border-border p-3 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                              {p.vc_image ? (
                                <img src={p.vc_image} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <StoreIcon size={18} className="text-muted-foreground/40" />
                              )}
                            </div>
                            <span className="flex-1 text-sm truncate">{p.name}</span>
                            <Input
                              type="number"
                              min={0}
                              value={quantities[p.id_product] ?? ''}
                              onChange={(e) =>
                                setQuantities((prev) => ({ ...prev, [p.id_product]: e.target.value }))
                              }
                              className="w-16 h-9 text-center shrink-0"
                            />
                          </div>
                        ))}
                    </div>
                  </details>
                </div>

                <div className="rounded-lg bg-primary/5 p-3 flex items-center justify-between">
                  <span className="text-sm font-medium">Total a cobrar</span>
                  <span className="text-lg font-bold text-primary">{money(total)}</span>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Checkbox checked={isConsigna} onCheckedChange={(c) => setIsConsigna(c === true)} />
                    Fue a consignación (no se cobró nada)
                  </label>
                  {!isConsigna && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Efectivo</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="$0.00"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Transferencia</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="$0.00"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {delivered === false && (
              <div>
                <Label>¿Por qué no se dejó la mercancía?</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
              </div>
            )}
          </>
        )}
      </div>

      {!alreadyVisited && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-border p-3">
          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
            Guardar
          </Button>
        </div>
      )}
    </div>
  )
}
