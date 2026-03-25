import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";

import { Card } from "../../components/ui/card";
import { DataTable } from "../../components/ui/datatble";
import { useAuthStore } from "../../store/authStore";
import { getMisPagos, MiPago, PromoterPaymentStatus } from "../../Fetch/finanzas";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("es-MX") : "—";

const BadgeStatus = ({ status }: { status: PromoterPaymentStatus }) => {
  const map = {
    pagado: "bg-green-100 text-green-800",
    pendiente: "bg-amber-100 text-amber-800",
  };
  const label = { pagado: "Pagado", pendiente: "Pendiente" };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${map[status]}`}>
      {label[status]}
    </span>
  );
};

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function FinanzasAdmin() {
  const { user } = useAuthStore();
  const [pagos, setPagos] = useState<MiPago[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getMisPagos(user.id_user)
      .then((res) => { if (res.ok) setPagos(res.data); })
      .catch(() => toast.error("Error al cargar tus pagos"))
      .finally(() => setLoading(false));
  }, [user]);

  const totalCobrado = pagos.filter((p) => p.status === "pagado").reduce((a, p) => a + p.f_monto, 0);
  const totalPendiente = pagos.filter((p) => p.status === "pendiente").reduce((a, p) => a + p.f_monto, 0);

  const columns: ColumnDef<MiPago>[] = [
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
      header: "Fecha de pago",
      cell: ({ row }) => fmtDate(row.getValue("dt_pago")),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => <BadgeStatus status={row.getValue("status")} />,
    },
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-6 h-6 mr-2 text-gray-500" />
        <span className="text-gray-500">Cargando tus pagos...</span>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Encabezado */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Mis Pagos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Historial y estado de pagos por tus servicios como promotor.
          </p>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-full bg-gray-800">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total acumulado</p>
              <p className="text-xl font-bold text-gray-900">{fmt(totalCobrado + totalPendiente)}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Cobrado</p>
              <p className="text-xl font-bold text-gray-900">{fmt(totalCobrado)}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-400">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Pendiente</p>
              <p className="text-xl font-bold text-gray-900">{fmt(totalPendiente)}</p>
            </div>
          </Card>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Detalle de pagos</h2>
          <DataTable
            columns={columns}
            data={pagos}
            isLoading={false}
            emptyMessage="No tienes pagos registrados aún."
          />
        </div>

      </div>
    </div>
  );
}
