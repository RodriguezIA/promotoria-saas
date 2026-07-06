import { toast } from "sonner"
import { useState } from "react"
import { Banknote, ArrowLeftRight, CreditCard, Store, Loader2, UploadCloud, Receipt, FileText, X } from "lucide-react"

import { submitInvoicePayment, ClientInvoice, MetodoPago } from "@/Fetch/finanzas"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label, Textarea } from "@/components"

interface Props {
  cobro: ClientInvoice | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const METODOS: {
  key: MetodoPago;
  label: string;
  icon: React.ElementType;
  color: string;
  border: string;
  refLabel?: string;
  refPlaceholder?: string;
}[] = [
  { key: "transferencia", label: "Transferencia", icon: ArrowLeftRight, color: "bg-info/10 text-info", border: "border-info/40", refLabel: "Folio / No. de referencia", refPlaceholder: "Ej. 123456789012345678" },
  { key: "efectivo", label: "Efectivo", icon: Banknote, color: "bg-success/10 text-success", border: "border-success/40" },
  { key: "tarjeta", label: "Tarjeta", icon: CreditCard, color: "bg-muted/50 text-foreground", border: "border-border", refLabel: "Últimos 4 dígitos", refPlaceholder: "Ej. 4321" },
  { key: "oxxo", label: "Depósito OXXO", icon: Store, color: "bg-destructive/10 text-destructive", border: "border-destructive/40", refLabel: "Folio de pago", refPlaceholder: "Ej. OXX-2025-00012345" },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

export function ModalPagarCobro({ cobro, open, onClose, onSuccess }: Props) {
  const [metodo, setMetodo] = useState<MetodoPago>("transferencia");
  const [monto, setMonto] = useState("");
  const [referencia, setReferencia] = useState("");
  const [notas, setNotas] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);

  const metodoCfg = METODOS.find((m) => m.key === metodo)!;

  const reset = () => {
    setMetodo("transferencia");
    setMonto("");
    setReferencia("");
    setNotas("");
    setFile(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const valid = ["image/", "application/pdf"];
    if (!valid.some((v) => f.type.startsWith(v))) {
      toast.error("El comprobante debe ser una imagen o PDF");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("El archivo no debe superar los 10MB");
      return;
    }
    setFile(f);
  };

  const handleConfirmar = async () => {
    if (!cobro) return;
    const montoNum = Number(monto);
    if (!monto || isNaN(montoNum) || montoNum <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    if (!file) {
      toast.error("Adjunta el comprobante de pago");
      return;
    }

    setGuardando(true);
    try {
      await submitInvoicePayment(cobro.id_invoice, {
        f_amount: montoNum,
        vc_method: metodo,
        vc_reference: referencia.trim() || undefined,
        vc_notes: notas.trim() || undefined,
        receipt: file,
      });
      toast.success("Comprobante enviado. Queda en revisión.");
      handleClose();
      onSuccess();
    } catch (e: any) {
      toast.error(e?.message || "Error al enviar el comprobante");
    } finally {
      setGuardando(false);
    }
  };

  if (!cobro) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-info" />
            Registrar pago
          </DialogTitle>
        </DialogHeader>

        {/* Info del cobro */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Folio</span>
            <span className="font-medium text-foreground">{cobro.vc_folio ?? `#${cobro.id_invoice}`}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 mt-2">
            <span className="text-muted-foreground font-medium">Monto a pagar</span>
            <span className="text-xl font-bold text-info">{fmt(cobro.f_total)}</span>
          </div>
        </div>

        {/* Método */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Método de pago</Label>
          <div className="grid grid-cols-2 gap-2">
            {METODOS.map((m) => {
              const Icon = m.icon;
              const selected = metodo === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => { setMetodo(m.key); setReferencia(""); }}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    selected ? `${m.color} ${m.border}` : "bg-white border-border text-muted-foreground hover:border-input hover:bg-accent"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Monto */}
        <div className="space-y-1.5">
          <Label htmlFor="monto-pago" className="text-sm font-medium text-foreground">Monto pagado</Label>
          <Input id="monto-pago" type="number" min="0" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />
        </div>

        {/* Referencia */}
        {metodoCfg.refLabel && (
          <div className="space-y-1.5">
            <Label htmlFor="referencia-pago" className="text-sm font-medium text-foreground">{metodoCfg.refLabel}</Label>
            <Input id="referencia-pago" value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder={metodoCfg.refPlaceholder} />
          </div>
        )}

        {/* Comprobante */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">Comprobante</Label>
          {!file ? (
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-input rounded-xl p-6 cursor-pointer text-muted-foreground hover:border-ring hover:text-foreground transition-colors">
              <UploadCloud size={28} />
              <span className="text-sm font-medium">Subir comprobante</span>
              <span className="text-xs text-muted-foreground/70">Imagen o PDF, hasta 10MB</span>
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
            </label>
          ) : (
            <div className="flex items-center gap-3 border border-border rounded-lg p-3 bg-muted/40">
              <FileText className="w-5 h-5 text-info shrink-0" />
              <span className="text-sm flex-1 truncate" title={file.name}>{file.name}</span>
              <button type="button" onClick={() => setFile(null)} className="text-destructive hover:bg-destructive/10 rounded p-1">
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Notas */}
        <div className="space-y-1.5">
          <Label htmlFor="notas-pago" className="text-sm font-medium text-foreground">
            Notas <span className="text-muted-foreground/70 font-normal">(opcional)</span>
          </Label>
          <Textarea id="notas-pago" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej. Pago realizado el día..." />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={guardando}>Cancelar</Button>
          <Button onClick={handleConfirmar} disabled={guardando} className="bg-info hover:bg-info/90 text-white">
            {guardando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}
            Enviar comprobante
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
