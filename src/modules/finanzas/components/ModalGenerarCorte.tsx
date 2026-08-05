import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Loader2, Calendar, RefreshCw } from "lucide-react"

import { previewCharges, generateCharges } from "@/Fetch/finanzas"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label } from "@/components"

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const hoyISO = () => new Date().toISOString().slice(0, 10);

export function ModalGenerarCorte({ open, onClose, onSuccess }: Props) {
  const [dtStart, setDtStart] = useState("");
  const [dtEnd, setDtEnd] = useState(hoyISO());
  const [dtDue, setDtDue] = useState("");
  const [preview, setPreview] = useState<{ id_client: number; f_total: number }[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    if (!open) {
      setDtStart("");
      setDtEnd(hoyISO());
      setDtDue("");
      setPreview(null);
    }
  }, [open]);

  const handlePreview = async () => {
    if (!dtStart || !dtEnd) {
      toast.error("Indica el rango de fechas del corte");
      return;
    }
    setBuscando(true);
    setPreview(null);
    try {
      const res = await previewCharges({ dt_start: dtStart, dt_end: dtEnd, dt_due: dtDue || dtEnd });
      if (res.ok) {
        setPreview(res.data.clients.map((c) => ({ id_client: c.id_client, f_total: c.f_total })));
      }
    } catch (e: any) {
      toast.error(e?.message || "Error al calcular el preview");
    } finally {
      setBuscando(false);
    }
  };

  const handleGenerar = async () => {
    if (!dtDue) {
      toast.error("Indica la fecha límite de pago para estas facturas");
      return;
    }
    setGenerando(true);
    try {
      const res = await generateCharges({ dt_start: dtStart, dt_end: dtEnd, dt_due: dtDue });
      if (res.ok) {
        toast.success("Corte generado exitosamente");
        onClose();
        onSuccess();
      }
    } catch (e: any) {
      toast.error(e?.message || "Error al generar el corte");
    } finally {
      setGenerando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-info" />
            Generar corte de cobros
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Se generará una factura por cada pedido cerrado con tareas terminadas en este rango de fechas.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="dt-start">Desde</Label>
            <Input id="dt-start" type="date" value={dtStart} onChange={(e) => { setDtStart(e.target.value); setPreview(null); }} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dt-end">Hasta</Label>
            <Input id="dt-end" type="date" value={dtEnd} onChange={(e) => { setDtEnd(e.target.value); setPreview(null); }} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dt-due">Fecha límite de pago para estas facturas</Label>
          <Input id="dt-due" type="date" value={dtDue} onChange={(e) => setDtDue(e.target.value)} />
        </div>

        <Button variant="outline" onClick={handlePreview} disabled={buscando} className="w-full">
          {buscando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Calcular preview
        </Button>

        {preview && (
          <div className="rounded-lg border border-border p-3 space-y-1.5 text-sm max-h-40 overflow-y-auto">
            {preview.length === 0 ? (
              <p className="text-muted-foreground text-center py-2">No hay tareas terminadas listas para facturar en este rango.</p>
            ) : (
              preview.map((c) => (
                <div key={c.id_client} className="flex justify-between">
                  <span className="text-muted-foreground">Cliente #{c.id_client}</span>
                  <span className="font-semibold">{fmt(c.f_total)}</span>
                </div>
              ))
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={generando}>Cancelar</Button>
          <Button onClick={handleGenerar} disabled={generando || !preview || preview.length === 0}>
            {generando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Generar corte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
