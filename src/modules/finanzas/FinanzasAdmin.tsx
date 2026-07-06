import { toast } from "sonner"
import { useEffect, useState, useCallback } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Loader2, CheckCircle2, Clock, Banknote, Upload, AlertCircle } from "lucide-react"

import { Button, DataTable, PageHeader, PageWrapper, StatCard } from "@/components"
import { getMyInvoices, ClientInvoice, InvoiceStatus, INVOICE_STATUS_LABEL } from "@/Fetch/finanzas"
import { ModalPagarCobro } from "./components/ModalPagarCobro"

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("es-MX") : "—";

const STATUS_STYLE: Record<InvoiceStatus, string> = {
  pendiente: "bg-warning/20 text-warning-foreground dark:text-warning",
  en_revision: "bg-info/15 text-info",
  aceptado: "bg-success/15 text-success",
  rechazado: "bg-destructive/15 text-destructive",
  atrasado: "bg-destructive/15 text-destructive",
};

const BadgeStatus = ({ status }: { status: InvoiceStatus }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[status]}`}>
    {INVOICE_STATUS_LABEL[status]}
  </span>
);

// Estatus en los que el cliente puede (re)enviar comprobante.
const PUEDE_PAGAR: InvoiceStatus[] = ["pendiente", "rechazado", "atrasado"];

export function FinanzasAdmin() {
  const [cobros, setCobros] = useState<ClientInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [cobroSel, setCobroSel] = useState<ClientInvoice | null>(null);

  const cargar = useCallback(() => {
    setLoading(true);
    getMyInvoices()
      .then((res) => { if (res.ok) setCobros(res.data); })
      .catch(() => toast.error("Error al cargar tus cobros"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const totalAdeudado = cobros
    .filter((c) => c.status === "pendiente" || c.status === "rechazado" || c.status === "atrasado")
    .reduce((a, c) => a + c.f_total, 0);
  const totalRevision = cobros.filter((c) => c.status === "en_revision").reduce((a, c) => a + c.f_total, 0);
  const totalPagado = cobros.filter((c) => c.status === "aceptado").reduce((a, c) => a + c.f_total, 0);

  const columns: ColumnDef<ClientInvoice>[] = [
    {
      accessorKey: "vc_folio",
      header: "Folio",
      cell: ({ row }) => <span className="font-bold text-foreground">{row.original.vc_folio ?? `#${row.original.id_invoice}`}</span>,
    },
    {
      accessorKey: "periodo",
      header: "Período",
      cell: ({ row }) => (
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {fmtDate(row.original.dt_periodo_inicio)} – {fmtDate(row.original.dt_periodo_fin)}
        </span>
      ),
    },
    {
      accessorKey: "f_total",
      header: "Total",
      cell: ({ row }) => <span className="font-semibold">{fmt(row.original.f_total)}</span>,
    },
    {
      accessorKey: "dt_vencimiento",
      header: "Vence",
      cell: ({ row }) => fmtDate(row.original.dt_vencimiento),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => <BadgeStatus status={row.original.status} />,
    },
    {
      id: "actions",
      header: "Operaciones",
      cell: ({ row }) => {
        const c = row.original;
        if (!PUEDE_PAGAR.includes(c.status)) return <span className="text-xs text-muted-foreground/70">—</span>;
        return (
          <Button size="sm" variant="outline" onClick={() => setCobroSel(c)} className="text-info border-info/30 hover:bg-info/10">
            <Upload className="w-3 h-3 mr-1" />
            Pagar
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
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Cargando tus cobros...</span>
        </div>
      </PageWrapper>
    );

  return (
    <PageWrapper>
      <PageHeader
        title="Mis Pagos"
        subtitle="Lo que debes por los servicios realizados y el estado de tus pagos"
        icon={Banknote}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <StatCard title="Por pagar" value={fmt(totalAdeudado)} icon={AlertCircle} accent="#dc2626" />
        <StatCard title="En revisión" value={fmt(totalRevision)} icon={Clock} accent="#2563eb" />
        <StatCard title="Pagado" value={fmt(totalPagado)} icon={CheckCircle2} accent="#16a34a" />
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border)" }}>
        <DataTable
          columns={columns}
          data={cobros}
          isLoading={false}
          emptyMessage="No tienes cobros registrados aún."
        />
      </div>

      <ModalPagarCobro
        cobro={cobroSel}
        open={cobroSel !== null}
        onClose={() => setCobroSel(null)}
        onSuccess={cargar}
      />
    </PageWrapper>
  );
}
