import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Loader2, Calendar, RefreshCw } from "lucide-react"

import { previewPromoterPayments, generatePromoterPayments } from "@/Fetch/finanzas"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label } from "@/components"

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const hoyISO = () => new Date().toISOString().slice(0, 10);

export function ModalGenerarPagoPromotor({ open, onClose, onSuccess }: Props) {
  const [dtStart, setDtStart] = useState("");
  const [dtEnd, setDtEnd] = useState(hoyISO());
  const [preview, setPreview] = useState<{ id_promoter: number; f_total: number }[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    if (!open) {
      setDtStart("");
      setDtEnd(hoyISO());
      setPreview(null);
    }
  }, [open]);

  const handlePreview = async () => {
    if (!dtStart || !dtEnd) {
      toast.error("Indica el rango de fechas");
      return;
    }
    setBuscando(true);
    setPreview(null);
    try {
      const res = await previewPromoterPayments({ dt_start: dtStart, dt_end: dtEnd });
      if (res.ok) {
        setPreview(res.data.promoters.map((p) => ({ id_promoter: p.id_promoter, f_total: p.f_total })));
      }
    } catch (e: any) {
      toast.error(e?.message || "Error al calcular el preview");
    } finally {
      setBuscando(false);
    }
  };

  const handleGenerar = async () => {
    setGenerando(true);
    try {
      const res = await generatePromoterPayments({ dt_start: dtStart, dt_end: dtEnd });
      if (res.ok) {
        toast.success("Pagos generados exitosamente");
        onClose();
        onSuccess();
      }
    } catch (e: any) {
      toast.error(e?.message || "Error al generar los pagos");
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
            Generar pagos a promotores
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Se calcula un pago por cada promotor con base en sus tareas terminadas en este rango de fechas, según el % de comisión configurado.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="prom-dt-start">Desde</Label>
            <Input id="prom-dt-start" type="date" value={dtStart} onChange={(e) => { setDtStart(e.target.value); setPreview(null); }} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prom-dt-end">Hasta</Label>
            <Input id="prom-dt-end" type="date" value={dtEnd} onChange={(e) => { setDtEnd(e.target.value); setPreview(null); }} />
          </div>
        </div>

        <Button variant="outline" onClick={handlePreview} disabled={buscando} className="w-full">
          {buscando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Calcular preview
        </Button>

        {preview && (
          <div className="rounded-lg border border-border p-3 space-y-1.5 text-sm max-h-40 overflow-y-auto">
            {preview.length === 0 ? (
              <p className="text-muted-foreground text-center py-2">No hay pagos por generar en este rango.</p>
            ) : (
              preview.map((p) => (
                <div key={p.id_promoter} className="flex justify-between">
                  <span className="text-muted-foreground">Promotor #{p.id_promoter}</span>
                  <span className="font-semibold">{fmt(p.f_total)}</span>
                </div>
              ))
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={generando}>Cancelar</Button>
          <Button onClick={handleGenerar} disabled={generando || !preview || preview.length === 0}>
            {generando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Generar pagos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
