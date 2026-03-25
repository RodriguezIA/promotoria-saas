import { useEffect, useState } from "react";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/ui/datatble";

import {
  getCobros,
  getPagosPromotores,
  getResumenFinanzas,
  CobroPedido,
  PagoPromotor,
  ResumenFinanzas,
  PaymentStatus,
  PromoterPaymentStatus,
  RegistrarPagoPayload,
} from "../../Fetch/finanzas";

import ModalRegistrarCobro from "./components/ModalRegistrarCobro";
import ModalRegistrarPagoPromotor from "./components/ModalRegistrarPagoPromotor";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("es-MX") : "—";

const BadgeStatus = ({ status }: { status: PaymentStatus | PromoterPaymentStatus }) => {
  const map: Record<string, string> = {
    pagado: "bg-green-100 text-green-800",
    pendiente: "bg-amber-100 text-amber-800",
    vencido: "bg-red-100 text-red-800",
  };
  const label: Record<string, string> = {
    pagado: "Pagado",
    pendiente: "Pendiente",
    vencido: "Vencido",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${map[status]}`}>
      {label[status]}
    </span>
  );
};

// ─── TARJETAS RESUMEN ─────────────────────────────────────────────────────────

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) => (
  <Card className="p-5 flex items-center gap-4">
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{title}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </Card>
);

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

type Tab = "cobros" | "promotores";

export default function FinanzasSuperAdmin() {
  const [tab, setTab] = useState<Tab>("cobros");
  const [resumen, setResumen] = useState<ResumenFinanzas | null>(null);
  const [cobros, setCobros] = useState<CobroPedido[]>([]);
  const [pagos, setPagos] = useState<PagoPromotor[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Estado modales ─────────────────────────────────────────────────────────
  const [cobroSeleccionado, setCobroSeleccionado] = useState<CobroPedido | null>(null);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<PagoPromotor | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [rRes, cRes, pRes] = await Promise.all([
          getResumenFinanzas(),
          getCobros(),
          getPagosPromotores(),
        ]);
        if (rRes.ok) setResumen(rRes.data);
        if (cRes.ok) setCobros(cRes.data);
        if (pRes.ok) setPagos(pRes.data);
      } catch {
        toast.error("Error al cargar datos financieros");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Callback éxito cobro ───────────────────────────────────────────────────
  const handleCobroSuccess = (id_cobro: number, payload: RegistrarPagoPayload) => {
    const cobro = cobros.find((c) => c.id_cobro === id_cobro);
    setCobros((prev) =>
      prev.map((c) =>
        c.id_cobro === id_cobro
          ? { ...c, status: "pagado", dt_pago: payload.dt_pago, f_pagado: c.f_total, f_pendiente: 0 }
          : c
      )
    );
    setResumen((prev) => {
      if (!prev || !cobro) return prev;
      return {
        ...prev,
        total_cobrado: prev.total_cobrado + cobro.f_total,
        total_pendiente_cobro: prev.total_pendiente_cobro - cobro.f_pendiente,
      };
    });
  };

  // ── Callback éxito pago promotor ───────────────────────────────────────────
  const handlePagoPromotorSuccess = (id_pago: number, payload: RegistrarPagoPayload) => {
    const pago = pagos.find((p) => p.id_pago === id_pago);
    setPagos((prev) =>
      prev.map((p) =>
        p.id_pago === id_pago ? { ...p, status: "pagado", dt_pago: payload.dt_pago } : p
      )
    );
    setResumen((prev) => {
      if (!prev || !pago) return prev;
      return {
        ...prev,
        total_pagado_promotores: prev.total_pagado_promotores + pago.f_monto,
        total_pendiente_promotores: prev.total_pendiente_promotores - pago.f_monto,
      };
    });
  };

  // ── Columnas cobros ────────────────────────────────────────────────────────
  const columnasCobros: ColumnDef<CobroPedido>[] = [
    {
      accessorKey: "id_order",
      header: "Pedido",
      cell: ({ row }) => <span className="font-bold text-gray-600">#{row.getValue("id_order")}</span>,
    },
    {
      accessorKey: "client_name",
      header: "Cliente",
      cell: ({ row }) => <span className="font-medium">{row.getValue("client_name")}</span>,
    },
    {
      accessorKey: "request_name",
      header: "Campaña",
    },
    {
      accessorKey: "f_total",
      header: "Total",
      cell: ({ row }) => (
        <span className="font-semibold text-gray-900">{fmt(row.getValue("f_total"))}</span>
      ),
    },
    {
      accessorKey: "f_pendiente",
      header: "Por cobrar",
      cell: ({ row }) => (
        <span className={row.getValue("f_pendiente") > 0 ? "text-red-600 font-semibold" : "text-gray-400"}>
          {fmt(row.getValue("f_pendiente"))}
        </span>
      ),
    },
    {
      accessorKey: "dt_vencimiento",
      header: "Vencimiento",
      cell: ({ row }) => fmtDate(row.getValue("dt_vencimiento")),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => <BadgeStatus status={row.getValue("status")} />,
    },
    {
      id: "actions",
      header: "Acción",
      cell: ({ row }) => {
        const cobro = row.original;
        if (cobro.status === "pagado") return <span className="text-xs text-gray-400">—</span>;
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCobroSeleccionado(cobro)}
            className="text-green-700 border-green-300 hover:bg-green-50"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Registrar cobro
          </Button>
        );
      },
    },
  ];

  // ── Columnas pagos promotores ──────────────────────────────────────────────
  const columnasPagos: ColumnDef<PagoPromotor>[] = [
    {
      accessorKey: "promoter_name",
      header: "Promotor",
      cell: ({ row }) => <span className="font-medium">{row.getValue("promoter_name")}</span>,
    },
    {
      accessorKey: "request_name",
      header: "Campaña",
    },
    {
      accessorKey: "f_monto",
      header: "Monto",
      cell: ({ row }) => (
        <span className="font-semibold text-gray-900">{fmt(row.getValue("f_monto"))}</span>
      ),
    },
    {
      accessorKey: "dt_periodo_inicio",
      header: "Período",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {fmtDate(row.original.dt_periodo_inicio)} – {fmtDate(row.original.dt_periodo_fin)}
        </span>
      ),
    },
    {
      accessorKey: "dt_pago",
      header: "Fecha pago",
      cell: ({ row }) => fmtDate(row.getValue("dt_pago")),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => <BadgeStatus status={row.getValue("status")} />,
    },
    {
      id: "actions",
      header: "Acción",
      cell: ({ row }) => {
        const pago = row.original;
        if (pago.status === "pagado") return <span className="text-xs text-gray-400">—</span>;
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPagoSeleccionado(pago)}
            className="text-blue-700 border-blue-300 hover:bg-blue-50"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Registrar pago
          </Button>
        );
      },
    },
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-6 h-6 mr-2 text-gray-500" />
        <span className="text-gray-500">Cargando finanzas...</span>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Encabezado */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Finanzas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión de cobros a clientes y pagos a promotores.
          </p>
        </div>

        {/* Tarjetas de resumen */}
        {resumen && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total cobrado"
              value={fmt(resumen.total_cobrado)}
              icon={TrendingUp}
              color="bg-green-500"
            />
            <StatCard
              title="Por cobrar"
              value={fmt(resumen.total_pendiente_cobro)}
              icon={AlertCircle}
              color="bg-red-400"
            />
            <StatCard
              title="Pagado a promotores"
              value={fmt(resumen.total_pagado_promotores)}
              icon={Users}
              color="bg-blue-500"
            />
            <StatCard
              title="Pendiente promotores"
              value={fmt(resumen.total_pendiente_promotores)}
              icon={Clock}
              color="bg-amber-400"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 flex gap-6">
          <button
            onClick={() => setTab("cobros")}
            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
              tab === "cobros"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Cobros a clientes
            <span className="ml-1 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
              {cobros.length}
            </span>
          </button>
          <button
            onClick={() => setTab("promotores")}
            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
              tab === "promotores"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <Users className="w-4 h-4" />
            Pagos a promotores
            <span className="ml-1 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
              {pagos.length}
            </span>
          </button>
        </div>

        {/* Tabla activa */}
        <div className="bg-white rounded-lg border shadow-sm p-4">
          {tab === "cobros" ? (
            <>
              <h2 className="text-base font-semibold text-gray-800 mb-4">Cobros de pedidos</h2>
              <DataTable
                columns={columnasCobros}
                data={cobros}
                isLoading={false}
                emptyMessage="No hay cobros registrados."
              />
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold text-gray-800 mb-4">Pagos a promotores</h2>
              <DataTable
                columns={columnasPagos}
                data={pagos}
                isLoading={false}
                emptyMessage="No hay pagos de promotores registrados."
              />
            </>
          )}
        </div>

      </div>

      {/* ── Modales ── */}
      <ModalRegistrarCobro
        cobro={cobroSeleccionado}
        open={cobroSeleccionado !== null}
        onClose={() => setCobroSeleccionado(null)}
        onSuccess={handleCobroSuccess}
      />

      <ModalRegistrarPagoPromotor
        pago={pagoSeleccionado}
        open={pagoSeleccionado !== null}
        onClose={() => setPagoSeleccionado(null)}
        onSuccess={handlePagoPromotorSuccess}
      />
    </div>
  );
}
