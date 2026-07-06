import { toast } from "sonner"
import { useEffect, useState, useCallback } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { TrendingUp, Clock, AlertCircle, Loader2, DollarSign, Users, Banknote, Settings, RefreshCw, Receipt, CheckCircle2 } from "lucide-react"

import { ModalRegistrarPagoPromotor, ModalRevisarCobro, ModalConfigFinanzas } from "./components"
import { Button, DataTable, PageWrapper, PageHeader, StatCard } from "@/components"
import {
  getInvoices, getPromoterPayments, getSummary, generateBilling,
  ClientInvoice, PromoterPayment, FinanceSummary, InvoiceStatus, PromoterPaymentStatus, INVOICE_STATUS_LABEL,
} from "@/Fetch/finanzas";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("es-MX") : "—";

const INVOICE_STYLE: Record<InvoiceStatus, string> = {
  pendiente: "bg-warning/20 text-warning-foreground dark:text-warning",
  en_revision: "bg-info/15 text-info",
  aceptado: "bg-success/15 text-success",
  rechazado: "bg-destructive/15 text-destructive",
  atrasado: "bg-destructive/15 text-destructive",
};

const BadgeInvoice = ({ status }: { status: InvoiceStatus }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${INVOICE_STYLE[status]}`}>{INVOICE_STATUS_LABEL[status]}</span>
);

const BadgePromoter = ({ status }: { status: PromoterPaymentStatus }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status === "pagado" ? "bg-success/15 text-success" : "bg-warning/20 text-warning-foreground dark:text-warning"}`}>
    {status === "pagado" ? "Pagado" : "Pendiente"}
  </span>
);

type Tab = "cobros" | "promotores";

export default function FinanzasSuperAdmin() {
  const [tab, setTab] = useState<Tab>("cobros");
  const [resumen, setResumen] = useState<FinanceSummary | null>(null);
  const [cobros, setCobros] = useState<ClientInvoice[]>([]);
  const [pagos, setPagos] = useState<PromoterPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);

  const [cobroSel, setCobroSel] = useState<ClientInvoice | null>(null);
  const [pagoSel, setPagoSel] = useState<PromoterPayment | null>(null);
  const [configOpen, setConfigOpen] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, cRes, pRes] = await Promise.all([getSummary(), getInvoices(), getPromoterPayments()]);
      if (rRes.ok) setResumen(rRes.data);
      if (cRes.ok) setCobros(cRes.data);
      if (pRes.ok) setPagos(pRes.data);
    } catch {
      toast.error("Error al cargar datos financieros");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleGenerar = async () => {
    setGenerando(true);
    try {
      const res = await generateBilling();
      if (res.ok) {
        toast.success(`Generados: ${res.data.invoices_creadas} cobros, ${res.data.pagos_promotor_creados} pagos`);
        await cargar();
      }
    } catch (e: any) {
      toast.error(e?.message || "Error al generar");
    } finally {
      setGenerando(false);
    }
  };

  const columnasCobros: ColumnDef<ClientInvoice>[] = [
    { accessorKey: "vc_folio", header: "Folio", cell: ({ row }) => <span className="font-bold text-muted-foreground">{row.original.vc_folio ?? `#${row.original.id_invoice}`}</span> },
    { accessorKey: "client_name", header: "Cliente", cell: ({ row }) => <span className="font-medium">{row.original.client_name}</span> },
    {
      accessorKey: "periodo", header: "Período",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{fmtDate(row.original.dt_periodo_inicio)} – {fmtDate(row.original.dt_periodo_fin)}</span>,
    },
    { accessorKey: "f_total", header: "Total", cell: ({ row }) => <span className="font-semibold text-foreground">{fmt(row.original.f_total)}</span> },
    { accessorKey: "dt_vencimiento", header: "Vence", cell: ({ row }) => fmtDate(row.original.dt_vencimiento) },
    { accessorKey: "status", header: "Estado", cell: ({ row }) => <BadgeInvoice status={row.original.status} /> },
    {
      id: "actions", header: "Operaciones",
      cell: ({ row }) => {
        const c = row.original;
        if (c.status === "aceptado") return <span className="text-xs text-muted-foreground/70">—</span>;
        return (
          <Button size="sm" variant="outline" onClick={() => setCobroSel(c)} className="text-info border-info/30 hover:bg-info/10">
            <Receipt className="w-3 h-3 mr-1" /> Revisar
          </Button>
        );
      },
    },
  ];

  const columnasPagos: ColumnDef<PromoterPayment>[] = [
    { accessorKey: "promoter_name", header: "Promotor", cell: ({ row }) => <span className="font-medium">{row.original.promoter_name}</span> },
    {
      accessorKey: "periodo", header: "Período",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{fmtDate(row.original.dt_periodo_inicio)} – {fmtDate(row.original.dt_periodo_fin)}</span>,
    },
    { accessorKey: "i_completed_tasks", header: "Tareas", cell: ({ row }) => <span className="tabular-nums">{row.original.i_completed_tasks}</span> },
    { accessorKey: "f_monto", header: "Monto", cell: ({ row }) => <span className="font-semibold text-foreground">{fmt(row.original.f_monto)}</span> },
    { accessorKey: "status", header: "Estado", cell: ({ row }) => <BadgePromoter status={row.original.status} /> },
    {
      id: "actions", header: "Operaciones",
      cell: ({ row }) => {
        const p = row.original;
        if (p.status === "pagado") return <span className="text-xs text-muted-foreground/70">—</span>;
        return (
          <Button size="sm" variant="outline" onClick={() => setPagoSel(p)} className="text-success border-success/30 hover:bg-success/10">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Registrar pago
          </Button>
        );
      },
    },
  ];

  if (loading)
    return (
      <PageWrapper>
        <div className="flex items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin w-5 h-5" style={{ color: "var(--text-secondary)" }} />
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Cargando finanzas...</span>
        </div>
      </PageWrapper>
    );

  return (
    <PageWrapper>
      <PageHeader
        title="Finanzas"
        subtitle="Gestión de cobros a clientes y pagos a promotores"
        icon={Banknote}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setConfigOpen(true)} className="flex items-center gap-2">
              <Settings size={16} /> Configuración
            </Button>
            <Button onClick={handleGenerar} disabled={generando} className="flex items-center gap-2">
              {generando ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Generar período
            </Button>
          </div>
        }
      />

      {resumen && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <StatCard title="Total cobrado" value={fmt(resumen.total_cobrado)} icon={TrendingUp} accent="#16a34a" />
          <StatCard title="Por cobrar" value={fmt(resumen.total_pendiente_cobro)} icon={AlertCircle} accent="#dc2626" />
          <StatCard title="Pagado promotores" value={fmt(resumen.total_pagado_promotores)} icon={Users} accent="#2563eb" />
          <StatCard title="Pendiente promotores" value={fmt(resumen.total_pendiente_promotores)} icon={Clock} accent="#d97706" />
        </div>
      )}

      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: "var(--hover)" }}>
        {(["cobros", "promotores"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
            style={
              tab === t
                ? { backgroundColor: "var(--card-bg)", color: "var(--text-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                : { color: "var(--text-secondary)" }
            }
          >
            {t === "cobros" ? <DollarSign className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            {t === "cobros" ? "Cobros a clientes" : "Pagos a promotores"}
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--border)", color: "var(--text-secondary)" }}>
              {t === "cobros" ? cobros.length : pagos.length}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border)" }}>
        {tab === "cobros" ? (
          <DataTable columns={columnasCobros} data={cobros} isLoading={false} emptyMessage="No hay cobros registrados." />
        ) : (
          <DataTable columns={columnasPagos} data={pagos} isLoading={false} emptyMessage="No hay pagos de promotores registrados." />
        )}
      </div>

      <ModalRevisarCobro cobro={cobroSel} open={cobroSel !== null} onClose={() => setCobroSel(null)} onSuccess={cargar} />
      <ModalRegistrarPagoPromotor pago={pagoSel} open={pagoSel !== null} onClose={() => setPagoSel(null)} onSuccess={cargar} />
      <ModalConfigFinanzas open={configOpen} onClose={() => setConfigOpen(false)} />
    </PageWrapper>
  );
}
