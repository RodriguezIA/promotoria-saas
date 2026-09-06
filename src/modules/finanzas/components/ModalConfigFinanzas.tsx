import { toast } from "sonner"
import { useEffect, useState } from "react"
import { Loader2, Settings, Clock, PackagePlus } from "lucide-react"

import { getTaskSettings, updateTaskSettings, updatePreorderPricing } from "@/Fetch/taskSettings"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label } from "@/components"

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ModalConfigFinanzas({ open, onClose }: Props) {
  const [horas, setHoras] = useState("24");
  const [prepedidoTipo, setPrepedidoTipo] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [prepedidoValor, setPrepedidoValor] = useState("0");
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getTaskSettings()
      .then((res) => {
        if (res.ok) {
          setHoras(String(res.data.i_review_timeout_hours));
          setPrepedidoTipo(res.data.preorder_pricing_type ?? 'FIXED');
          setPrepedidoValor(String(res.data.preorder_pricing_value ?? 0));
        }
      })
      .catch(() => toast.error("Error al cargar la configuración"))
      .finally(() => setLoading(false));
  }, [open]);

  const handleGuardar = async () => {
    const horasNum = Number(horas);
    if (!horas || isNaN(horasNum) || horasNum < 1 || horasNum > 720) {
      toast.error("Indica un número de horas entre 1 y 720");
      return;
    }
    const valorNum = Number(prepedidoValor);
    if (isNaN(valorNum) || valorNum < 0) {
      toast.error("El valor del cargo por Prepedido debe ser 0 o mayor");
      return;
    }
    setGuardando(true);
    try {
      await updateTaskSettings(horasNum);
      await updatePreorderPricing(prepedidoTipo, valorNum);
      toast.success("Configuración guardada exitosamente");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar la configuración");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-info" />
            Configuración
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Cargando...
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="horas-revision" className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Horas para que el cliente revise una tarea
              </Label>
              <Input
                id="horas-revision"
                type="number"
                min="1"
                max="720"
                value={horas}
                onChange={(e) => setHoras(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Si el cliente no acepta ni rechaza una tarea en este tiempo, el sistema la aprueba automáticamente.
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-border">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <PackagePlus className="w-4 h-4" />
                Cargo extra por el extra "Prepedido"
              </Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPrepedidoTipo('FIXED')}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                    prepedidoTipo === 'FIXED' ? 'border-info bg-info/10 text-info' : 'border-border text-muted-foreground'
                  }`}
                >
                  Monto fijo ($)
                </button>
                <button
                  type="button"
                  onClick={() => setPrepedidoTipo('PERCENTAGE')}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                    prepedidoTipo === 'PERCENTAGE' ? 'border-info bg-info/10 text-info' : 'border-border text-muted-foreground'
                  }`}
                >
                  Porcentaje (%)
                </button>
              </div>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={prepedidoValor}
                onChange={(e) => setPrepedidoValor(e.target.value)}
                placeholder={prepedidoTipo === 'FIXED' ? 'Ej. 50' : 'Ej. 20'}
              />
              <p className="text-xs text-muted-foreground">
                {prepedidoTipo === 'FIXED'
                  ? 'Se suma este monto al total de la solicitud si tiene Prepedido activado.'
                  : 'Se suma este porcentaje sobre el total de la solicitud si tiene Prepedido activado.'}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={guardando}>Cancelar</Button>
          <Button onClick={handleGuardar} disabled={guardando || loading}>
            {guardando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
