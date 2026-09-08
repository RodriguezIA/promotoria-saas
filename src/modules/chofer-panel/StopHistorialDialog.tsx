import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, PackageCheck, PackageX } from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Label, Input, Textarea, Badge } from '@/components'
import { DriverRouteStopDTO, updateStop } from '@/Fetch/driverPanel'

const PAYMENT_OPTIONS = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'CONSIGNA', label: 'Consigna' },
] as const

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
  const [delivered, setDelivered] = useState<boolean | null>(null)
  const [reason, setReason] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [amountPaid, setAmountPaid] = useState('')
  const [saving, setSaving] = useState(false)

  if (!stop) return null

  const handleSave = async () => {
    if (delivered === null) {
      toast.error('Indica si se dejó o no la mercancía')
      return
    }
    if (delivered && !paymentMethod) {
      toast.error('Indica cómo se cobró')
      return
    }
    if (!delivered && !reason.trim()) {
      toast.error('Indica por qué no se dejó la mercancía')
      return
    }
    setSaving(true)
    try {
      const res = await updateStop(stop.id_stop, {
        i_status: 1,
        b_delivered: delivered,
        vc_no_delivery_reason: delivered ? undefined : reason.trim(),
        payment_method: delivered ? (paymentMethod as any) : undefined,
        f_amount_paid: delivered && paymentMethod === 'EFECTIVO' && amountPaid ? Number(amountPaid) : undefined,
      })
      toast.success('Visita registrada')
      onUpdated(res.data)
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Error al registrar la visita')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{stop.store.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Pedido a surtir</Label>
            <div className="rounded-lg bg-muted/40 p-3 mt-1 space-y-1">
              {stop.preorder.items.map((item, i) => (
                <p key={i} className="text-sm">
                  <span className="font-bold">{item.i_quantity}</span> {item.product.name}
                </p>
              ))}
            </div>
          </div>

          {stop.i_status === 1 ? (
            <div className="rounded-lg border border-border p-3 space-y-1 text-sm">
              <Badge className={stop.b_delivered ? 'bg-success/10 text-success border-success/30' : 'bg-destructive/10 text-destructive border-destructive/30'}>
                {stop.b_delivered ? 'Se dejó mercancía' : 'No se dejó mercancía'}
              </Badge>
              {stop.b_delivered ? (
                <p className="text-muted-foreground">
                  Pago: {stop.payment_method}{stop.f_amount_paid ? ` · $${stop.f_amount_paid}` : ''}
                </p>
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
                <div>
                  <Label>¿Cómo se cobró?</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {PAYMENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPaymentMethod(opt.value)}
                        className={`rounded-lg border-2 p-2 text-xs ${paymentMethod === opt.value ? 'border-primary bg-primary/5' : 'border-border'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {paymentMethod === 'EFECTIVO' && (
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="¿Cuánto le pagaron?"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>
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
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
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
