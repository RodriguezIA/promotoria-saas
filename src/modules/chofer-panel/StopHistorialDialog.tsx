import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, PackageCheck, PackageX } from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Label, Input, Textarea, Badge, Checkbox } from '@/components'
import { DriverRouteStopDTO, updateStop, getDriverProducts, DriverProductDTO } from '@/Fetch/driverPanel'
import { useDriverAuthStore } from '@/stores/driverAuthStore'

const money = (n: number) => `$${n.toFixed(2)}`

export function StopHistorialDialog({
  stop,
  open,
  onOpenChange,
  onUpdated,
}: {
  stop: DriverRouteStopDTO | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (stop: DriverRouteStopDTO) => void
}) {
  const driver = useDriverAuthStore((s) => s.driver)
  const [delivered, setDelivered] = useState<boolean | null>(null)
  const [reason, setReason] = useState('')
  const [products, setProducts] = useState<DriverProductDTO[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [quantities, setQuantities] = useState<Record<number, string>>({})
  const [isConsigna, setIsConsigna] = useState(false)
  const [cashAmount, setCashAmount] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [saving, setSaving] = useState(false)

  // Cuando se abre y ya se marco "si se dejo", carga el catalogo completo
  // del cliente y pre-llena con lo que decia el pedido, si habia uno.
  useEffect(() => {
    if (!open || !stop || !driver || delivered !== true || products.length > 0) return
    setLoadingProducts(true)
    getDriverProducts(driver.id_client)
      .then((res) => {
        setProducts(res.data)
        if (stop.preorder) {
          const initial: Record<number, string> = {}
          stop.preorder.items.forEach((item) => {
            const match = res.data.find((p) => p.name === item.product.name)
            if (match) initial[match.id_product] = String(item.i_quantity)
          })
          setQuantities(initial)
        }
      })
      .catch(() => toast.error('Error al cargar el catálogo de productos'))
      .finally(() => setLoadingProducts(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, delivered, stop, driver])

  const total = useMemo(() => {
    return products.reduce((sum, p) => {
      const qty = Number(quantities[p.id_product] || 0)
      if (!qty) return sum
      return sum + qty * Number(p.f_store_price ?? 0)
    }, 0)
  }, [products, quantities])

  if (!stop) return null

  const reset = () => {
    setDelivered(null)
    setReason('')
    setProducts([])
    setQuantities({})
    setIsConsigna(false)
    setCashAmount('')
    setTransferAmount('')
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSave = async () => {
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
      toast.error('Marca al menos un producto que se haya dejado')
      return
    }
    if (delivered && !isConsigna && !cashAmount && !transferAmount) {
      toast.error('Indica cómo se cobró')
      return
    }
    setSaving(true)
    try {
      const res = await updateStop(stop.id_stop, {
        i_status: 1,
        b_delivered: delivered,
        vc_no_delivery_reason: delivered ? undefined : reason.trim(),
        b_consigna: delivered ? isConsigna : undefined,
        f_amount_cash: delivered && !isConsigna && cashAmount ? Number(cashAmount) : undefined,
        f_amount_transfer: delivered && !isConsigna && transferAmount ? Number(transferAmount) : undefined,
        items: delivered ? items : undefined,
      })
      toast.success('Visita registrada')
      onUpdated(res.data)
      handleOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Error al registrar la visita')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b border-border shrink-0">
          <DialogTitle className="text-base">{stop.store.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {stop.preorder && (
            <div>
              <Label className="text-xs">Pedido original</Label>
              <div className="rounded-lg bg-muted/40 p-3 mt-1 space-y-1">
                {stop.preorder.items.map((item, i) => (
                  <p key={i} className="text-sm">
                    <span className="font-bold">{item.i_quantity}</span> {item.product.name}
                  </p>
                ))}
              </div>
            </div>
          )}

          {stop.i_status === 1 ? (
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
                  <div>
                    <Label>¿Qué productos se dejaron?</Label>
                    {loadingProducts ? (
                      <div className="flex justify-center py-4">
                        <Loader2 size={18} className="animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <ul className="mt-1 divide-y divide-border rounded-lg border border-border">
                        {products.map((p) => {
                          const checked = quantities[p.id_product] !== undefined
                          return (
                            <li key={p.id_product} className="flex items-center gap-3 p-2.5">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(c) => {
                                  setQuantities((prev) => {
                                    const next = { ...prev }
                                    if (c === true) next[p.id_product] = next[p.id_product] || '1'
                                    else delete next[p.id_product]
                                    return next
                                  })
                                }}
                              />
                              <span className="flex-1 text-sm min-w-0 truncate">{p.name}</span>
                              {checked && (
                                <Input
                                  type="number"
                                  min={0}
                                  value={quantities[p.id_product]}
                                  onChange={(e) => setQuantities((prev) => ({ ...prev, [p.id_product]: e.target.value }))}
                                  className="w-16 h-8 text-sm shrink-0"
                                />
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    )}
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

        {stop.i_status !== 1 && (
          <DialogFooter className="p-4 pt-2 border-t border-border shrink-0">
            <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
