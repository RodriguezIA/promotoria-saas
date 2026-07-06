import { toast } from "sonner"
import { useEffect, useState } from "react"
import { Loader2, CheckCircle2, XCircle, Receipt, FileText, ExternalLink, Clock } from "lucide-react"

import { getInvoiceDetail, reviewInvoicePayment, markInvoiceLate, ClientInvoice, InvoicePaymentDetail } from "@/Fetch/finanzas"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Label, Textarea } from "@/components"

interface Props {
  cobro: ClientInvoice | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const isImage = (url: string) => /\.(png|jpe?g|webp|gif)$/i.test(url);

export function ModalRevisarCobro({ cobro, open, onClose, onSuccess }: Props) {
  const [detalle, setDetalle] = useState<ClientInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [notas, setNotas] = useState("");
  const [accion, setAccion] = useState<null | "aceptar" | "rechazar" | "atrasar">(null);

  useEffect(() => {
    if (!open || !cobro) return;
    setLoading(true);
    setNotas("");
    getInvoiceDetail(cobro.id_invoice)
      .then((res) => { if (res.ok) setDetalle(res.data); })
      .catch(() => toast.error("Error al cargar el comprobante"))
      .finally(() => setLoading(false));
  }, [open, cobro]);

  // Comprobante a revisar: el más reciente en revisión (i_status === 1).
  const pago: InvoicePaymentDetail | undefined = detalle?.payments?.find((p) => p.i_status === 1) ?? detalle?.payments?.[0];

  const ejecutar = async (decision: "aceptado" | "rechazado") => {
    if (!pago) { toast.error("No hay comprobante para revisar"); return; }
    setAccion(decision === "aceptado" ? "aceptar" : "rechazar");
    try {
      await reviewInvoicePayment(pago.id_invoice_payment, { decision, vc_review_notes: notas.trim() || undefined });
      toast.success(decision === "aceptado" ? "Cobro aceptado" : "Comprobante rechazado");
      onClose();
      onSuccess();
    } catch (e: any) {
      toast.error(e?.message || "Error al revisar el comprobante");
    } finally {
      setAccion(null);
    }
  };

  const atrasar = async () => {
    if (!cobro) return;
    setAccion("atrasar");
    try {
      await markInvoiceLate(cobro.id_invoice);
      toast.success("Cobro marcado como atrasado");
      onClose();
      onSuccess();
    } catch (e: any) {
      toast.error(e?.message || "Error al marcar como atrasado");
    } finally {
      setAccion(null);
    }
  };

  if (!cobro) return null;
  const busy = accion !== null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-info" />
            Revisar cobro
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Cargando...
          </div>
        ) : (
          <>
            <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-semibold text-foreground">{cobro.client_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Folio</span>
                <span className="font-medium text-foreground">{cobro.vc_folio ?? `#${cobro.id_invoice}`}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 mt-2">
                <span className="text-muted-foreground font-medium">Total del cobro</span>
                <span className="text-lg font-bold text-foreground">{fmt(cobro.f_total)}</span>
              </div>
            </div>

            {!pago ? (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center text-muted-foreground text-sm">
                El cliente aún no ha subido un comprobante para este cobro.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-border p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Monto declarado</span><span className="font-semibold">{fmt(pago.f_amount)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Método</span><span className="capitalize">{pago.vc_method}</span></div>
                  {pago.vc_reference && <div className="flex justify-between"><span className="text-muted-foreground">Referencia</span><span>{pago.vc_reference}</span></div>}
                  {pago.vc_notes && <div className="text-muted-foreground">Nota: <span className="text-foreground">{pago.vc_notes}</span></div>}
                </div>

                {/* Comprobante */}
                {pago.vc_receipt_url ? (
                  isImage(pago.vc_receipt_url) ? (
                    <a href={pago.vc_receipt_url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-border">
                      <img src={pago.vc_receipt_url} alt="Comprobante" className="w-full max-h-64 object-contain bg-muted" />
                    </a>
                  ) : (
                    <a href={pago.vc_receipt_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-border p-3 text-info hover:bg-info/10">
                      <FileText className="w-5 h-5" /> Ver comprobante <ExternalLink className="w-4 h-4 ml-auto" />
                    </a>
                  )
                ) : (
                  <p className="text-xs text-muted-foreground italic">Sin archivo adjunto.</p>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="review-notas" className="text-sm font-medium">Nota de revisión <span className="text-muted-foreground/70 font-normal">(opcional)</span></Label>
                  <Textarea id="review-notas" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Motivo del rechazo o comentario..." />
                </div>
              </div>
            )}
          </>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={atrasar} disabled={busy} className="text-destructive border-destructive/30 hover:bg-destructive/10">
            {accion === "atrasar" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
            Atrasado
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => ejecutar("rechazado")} disabled={busy || !pago} className="text-destructive border-destructive/30 hover:bg-destructive/10">
            {accion === "rechazar" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
            Rechazar
          </Button>
          <Button onClick={() => ejecutar("aceptado")} disabled={busy || !pago} className="bg-success hover:bg-success/90 text-white">
            {accion === "aceptar" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
