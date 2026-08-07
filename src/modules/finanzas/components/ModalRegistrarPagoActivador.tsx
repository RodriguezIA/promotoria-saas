import { toast } from "sonner"
import { useEffect, useState } from "react"
import { Loader2, Receipt, CheckCircle2, XCircle } from "lucide-react"

import {
  getActivatorPaymentById,
  submitActivatorPayment,
  cancelActivatorPayment,
  ActivatorPayment,
  ActivatorPaymentDetail,
  ACTIVATOR_PAYMENT_STATUS,
} from "@/Fetch/finanzas"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components"

interface Props {
  pago: ActivatorPayment | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const hoyISO = () => new Date().toISOString().slice(0, 10);

export function ModalRegistrarPagoActivador({ pago, open, onClose, onSuccess }: Props) {
  const [detalle, setDetalle] = useState<ActivatorPaymentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [fechaPago, setFechaPago] = useState(hoyISO());
  const [idCuenta, setIdCuenta] = useState<string>("");
  const [notas, setNotas] = useState("");
  const [accion, setAccion] = useState<null | "pagar" | "cancelar">(null);

  useEffect(() => {
    if (!open || !pago) return;
    setLoading(true);
    setFechaPago(hoyISO());
    setIdCuenta("");
    setNotas("");
    getActivatorPaymentById(pago.id_payment)
      .then((res) => { if (res.ok) setDetalle(res.data); })
      .catch(() => toast.error("Error al cargar el pago"))
      .finally(() => setLoading(false));
  }, [open, pago]);

  const handlePagar = async () => {
    if (!pago) return;
    if (!fechaPago) {
      toast.error("Indica la fecha de pago");
      return;
    }
    setAccion("pagar");
    try {
      await submitActivatorPayment(pago.id_payment, {
        dt_payment: fechaPago,
        id_bank_account: idCuenta ? Number(idCuenta) : undefined,
        vc_notes: notas.trim() || undefined,
      });
      toast.success("Pago registrado exitosamente");
      onClose();
      onSuccess();
    } catch (e: any) {
      toast.error(e?.message || "Error al registrar el pago");
    } finally {
      setAccion(null);
    }
  };

  const handleCancelar = async () => {
    if (!pago) return;
    setAccion("cancelar");
    try {
      await cancelActivatorPayment(pago.id_payment);
      toast.success("Pago cancelado");
      onClose();
      onSuccess();
    } catch (e: any) {
      toast.error(e?.message || "Error al cancelar el pago");
    } finally {
      setAccion(null);
    }
  };

  if (!pago) return null;
  const busy = accion !== null;
  const puedeAccionar = pago.id_status === ACTIVATOR_PAYMENT_STATUS.POR_PAGAR;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-info" />
            Comisión de activador
          </DialogTitle>
        </DialogHeader>

        {loading || !detalle ? (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Cargando...
          </div>
        ) : (
          <>
            <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Folio</span>
                <span className="font-medium text-foreground">{detalle.vc_folio ?? `#${detalle.id_payment}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Activador</span>
                <span className="font-medium text-foreground">
                  {detalle.activator.name} {detalle.activator.lastname ?? ""} · {detalle.activator.phone}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 mt-2">
                <span className="text-muted-foreground font-medium">Total a pagar</span>
                <span className="text-lg font-bold text-foreground">{fmt(Number(detalle.f_total))}</span>
              </div>
            </div>

            {puedeAccionar && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fecha-pago-act">Fecha de pago</Label>
                  <Input id="fecha-pago-act" type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
                </div>

                {detalle.activator.promoter_bank_accounts.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Cuenta bancaria (opcional)</Label>
                    <Select value={idCuenta} onValueChange={setIdCuenta}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin especificar" />
                      </SelectTrigger>
                      <SelectContent>
                        {detalle.activator.promoter_bank_accounts.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.bank_name} — {c.account_holder_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="notas-pago-act">Notas (opcional)</Label>
                  <Input id="notas-pago-act" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej. referencia de transferencia" />
                </div>
              </>
            )}
          </>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {puedeAccionar ? (
            <>
              <Button variant="outline" onClick={handleCancelar} disabled={busy} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                {accion === "cancelar" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                Cancelar comisión
              </Button>
              <div className="flex-1" />
              <Button onClick={handlePagar} disabled={busy} className="bg-success hover:bg-success/90 text-white">
                {accion === "pagar" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Marcar como pagado
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose} className="w-full">Cerrar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
