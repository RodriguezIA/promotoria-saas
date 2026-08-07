import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Loader2, Calendar, RefreshCw } from "lucide-react"

import { previewActivatorPayments, generateActivatorPayments } from "@/Fetch/finanzas"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label } from "@/components"

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const hoyISO = () => new Date().toISOString().slice(0, 10);

export function ModalGenerarComisionActivador({ open, onClose, onSuccess }: Props) {
  const [dtStart, setDtStart] = useState("");
  const [dtEnd, setDtEnd] = useState(hoyISO());
  const [preview, setPreview] = useState<{ id_activator: number; f_total: number }[] | null>(null);
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
      const res = await previewActivatorPayments({ dt_start: dtStart, dt_end: dtEnd });
      if (res.ok) {
        setPreview(res.data.activators.map((a) => ({ id_activator: a.id_activator, f_total: a.f_total })));
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
      const res = await generateActivatorPayments({ dt_start: dtStart, dt_end: dtEnd });
      if (res.ok) {
        toast.success("Comisiones generadas exitosamente");
        onClose();
        onSuccess();
      }
    } catch (e: any) {
      toast.error(e?.message || "Error al generar las comisiones");
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
            Generar comisiones de activadores
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Se calcula un pago por cada activador con base en las tareas terminadas de sus promotores referidos en este rango de fechas, según el % de comisión configurado.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="act-dt-start">Desde</Label>
            <Input id="act-dt-start" type="date" value={dtStart} onChange={(e) => { setDtStart(e.target.value); setPreview(null); }} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="act-dt-end">Hasta</Label>
            <Input id="act-dt-end" type="date" value={dtEnd} onChange={(e) => { setDtEnd(e.target.value); setPreview(null); }} />
          </div>
        </div>

        <Button variant="outline" onClick={handlePreview} disabled={buscando} className="w-full">
          {buscando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Calcular preview
        </Button>

        {preview && (
          <div className="rounded-lg border border-border p-3 space-y-1.5 text-sm max-h-40 overflow-y-auto">
            {preview.length === 0 ? (
              <p className="text-muted-foreground text-center py-2">No hay comisiones por generar en este rango.</p>
            ) : (
              preview.map((a) => (
                <div key={a.id_activator} className="flex justify-between">
                  <span className="text-muted-foreground">Activador #{a.id_activator}</span>
                  <span className="font-semibold">{fmt(a.f_total)}</span>
                </div>
              ))
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={generando}>Cancelar</Button>
          <Button onClick={handleGenerar} disabled={generando || !preview || preview.length === 0}>
            {generando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Generar comisiones
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
