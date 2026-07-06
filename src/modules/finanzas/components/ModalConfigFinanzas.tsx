import { toast } from "sonner"
import { useEffect, useState } from "react"
import { Loader2, Settings, Save, Percent } from "lucide-react"

import { getConfig, saveGlobalConfig, saveClientConfig, FinanceConfig } from "@/Fetch/finanzas"
import { getCLientsList } from "@/Fetch/clientes"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components"

interface Props {
  open: boolean;
  onClose: () => void;
}

const DIAS = [
  { v: 1, l: "Lunes" }, { v: 2, l: "Martes" }, { v: 3, l: "Miércoles" },
  { v: 4, l: "Jueves" }, { v: 5, l: "Viernes" }, { v: 6, l: "Sábado" }, { v: 7, l: "Domingo" },
];

export function ModalConfigFinanzas({ open, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<FinanceConfig | null>(null);
  const [clientes, setClientes] = useState<{ id_client: number; name: string }[]>([]);

  // Global
  const [pct, setPct] = useState("50");
  const [periodG, setPeriodG] = useState("7");
  const [weekdayG, setWeekdayG] = useState("1");
  const [dueG, setDueG] = useState("7");
  const [savingG, setSavingG] = useState(false);

  // Override por cliente
  const [clienteSel, setClienteSel] = useState<string>("");
  const [periodC, setPeriodC] = useState("7");
  const [weekdayC, setWeekdayC] = useState("1");
  const [dueC, setDueC] = useState("7");
  const [savingC, setSavingC] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([getConfig(), getCLientsList()])
      .then(([cfgRes, cliRes]) => {
        if (cfgRes.ok) {
          setConfig(cfgRes.data);
          const g = cfgRes.data.global;
          setPct(String(Number(g.f_promoter_pct)));
          setPeriodG(String(g.i_default_period_days));
          setWeekdayG(String(g.i_default_billing_weekday));
          setDueG(String(g.i_default_payment_due_days));
        }
        setClientes(cliRes?.data ?? []);
      })
      .catch(() => toast.error("Error al cargar la configuración"))
      .finally(() => setLoading(false));
  }, [open]);

  // Al elegir cliente, prefill con su override si existe.
  useEffect(() => {
    if (!clienteSel || !config) return;
    const existing = config.clients.find((c) => c.id_client === Number(clienteSel));
    setPeriodC(String(existing?.i_period_days ?? config.global.i_default_period_days));
    setWeekdayC(String(existing?.i_billing_weekday ?? config.global.i_default_billing_weekday));
    setDueC(String(existing?.i_payment_due_days ?? config.global.i_default_payment_due_days));
  }, [clienteSel, config]);

  const guardarGlobal = async () => {
    setSavingG(true);
    try {
      await saveGlobalConfig({
        f_promoter_pct: Number(pct),
        i_default_period_days: Number(periodG),
        i_default_billing_weekday: Number(weekdayG),
        i_default_payment_due_days: Number(dueG),
      });
      toast.success("Configuración global guardada");
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar");
    } finally {
      setSavingG(false);
    }
  };

  const guardarCliente = async () => {
    if (!clienteSel) { toast.error("Selecciona un cliente"); return; }
    setSavingC(true);
    try {
      await saveClientConfig(Number(clienteSel), {
        i_period_days: Number(periodC),
        i_billing_weekday: Number(weekdayC),
        i_payment_due_days: Number(dueC),
        b_active: true,
      });
      toast.success("Configuración del cliente guardada");
      const res = await getConfig();
      if (res.ok) setConfig(res.data);
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar");
    } finally {
      setSavingC(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-info" /> Configuración financiera
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Cargando...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Global */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Percent className="w-4 h-4" /> Global</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">% pago a promotor</Label>
                  <Input type="number" min="0" max="100" step="0.01" value={pct} onChange={(e) => setPct(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Días del período</Label>
                  <Input type="number" min="1" value={periodG} onChange={(e) => setPeriodG(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Día de corte</Label>
                  <Select value={weekdayG} onValueChange={setWeekdayG}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DIAS.map((d) => <SelectItem key={d.v} value={String(d.v)}>{d.l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Días para pagar</Label>
                  <Input type="number" min="0" value={dueG} onChange={(e) => setDueG(e.target.value)} />
                </div>
              </div>
              <Button onClick={guardarGlobal} disabled={savingG} size="sm" className="w-full">
                {savingG ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar global
              </Button>
            </section>

            <div className="border-t border-border" />

            {/* Override por cliente */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-foreground">Override por cliente</h3>
              <div className="space-y-1.5">
                <Label className="text-xs">Cliente</Label>
                <Select value={clienteSel} onValueChange={setClienteSel}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => <SelectItem key={c.id_client} value={String(c.id_client)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {clienteSel && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Días período</Label>
                      <Input type="number" min="1" value={periodC} onChange={(e) => setPeriodC(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Día corte</Label>
                      <Select value={weekdayC} onValueChange={setWeekdayC}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{DIAS.map((d) => <SelectItem key={d.v} value={String(d.v)}>{d.l}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Días pago</Label>
                      <Input type="number" min="0" value={dueC} onChange={(e) => setDueC(e.target.value)} />
                    </div>
                  </div>
                  <Button onClick={guardarCliente} disabled={savingC} size="sm" variant="outline" className="w-full">
                    {savingC ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Guardar override
                  </Button>
                </>
              )}
              <p className="text-xs text-muted-foreground">El % de pago a promotor es global y aplica a todos los clientes.</p>
            </section>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
