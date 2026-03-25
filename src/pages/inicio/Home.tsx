import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { StatCard } from "../../components/dashboard/StatCard";
import { DateRangePicker } from "../../components/dashboard/DateRangePicker";
import { Users, Store, UserCheck, Briefcase, Loader2, ShoppingCart } from "lucide-react";
import { PromoterHeatMap } from "./components/PromoterHearMap";

import {
  getDashboardAnalytics,
  getAdminDashboardStats,
  DashboardAnalytics,
  AdminDashboardStats,
} from "../../Fetch/inicio";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const defaultDateFrom = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d;
};

const toISOLocal = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function Home() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.i_rol === 1;

  const [dateFrom, setDateFrom] = useState<Date>(defaultDateFrom());
  const [dateTo, setDateTo] = useState<Date>(new Date());

  const [superStats, setSuperStats] = useState<DashboardAnalytics | null>(null);
  const [adminStats, setAdminStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Carga superadmin ──────────────────────────────────────────────────────
  const fetchSuperStats = async (from: Date, to: Date) => {
    setLoading(true);
    try {
      const data = await getDashboardAnalytics(toISOLocal(from), toISOLocal(to));
      setSuperStats(data);
    } catch (error) {
      console.error("Error cargando analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Carga admin ───────────────────────────────────────────────────────────
  const fetchAdminStats = async () => {
    if (!user?.id_client) return;
    setLoading(true);
    try {
      const data = await getAdminDashboardStats(user.id_client);
      setAdminStats(data);
    } catch (error) {
      console.error("Error cargando stats de admin:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchSuperStats(dateFrom, dateTo);
    } else {
      fetchAdminStats();
    }
  }, []);

  const handleDateChange = (from: Date | undefined, to: Date | undefined) => {
    if (!from || !to) return;
    setDateFrom(from);
    setDateTo(to);
    if (isSuperAdmin) fetchSuperStats(from, to);
  };

  // ── Heatmap data ──────────────────────────────────────────────────────────
  const heatmapData = isSuperAdmin
    ? (superStats?.heatmapPromoters ?? [])
    : (adminStats?.heatmapPromoters ?? []);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isSuperAdmin
              ? "Vista general de todos los negocios"
              : "Vista de tu negocio"}
          </p>
        </div>
        {/* El date picker solo aplica para superadmin ya que su endpoint lo soporta */}
        {isSuperAdmin && <DateRangePicker onDateChange={handleDateChange} />}
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : isSuperAdmin ? (
        // ── Tarjetas SuperAdmin ──────────────────────────────────────────────
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Clientes"
            value={(superStats?.totalClients ?? 0).toLocaleString()}
            icon={Users}
            description="Total de clientes"
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            title="Usuarios Promotores"
            value={(superStats?.totalUsuariosPromotores ?? 0).toLocaleString()}
            icon={UserCheck}
            description="Promotores registrados"
            trend={{ value: 8.2, isPositive: true }}
          />
          <StatCard
            title="Establecimientos"
            value={(superStats?.totalStores ?? 0).toLocaleString()}
            icon={Store}
            description="Total establecimientos"
            trend={{ value: 3.1, isPositive: true }}
          />
          <StatCard
            title="Promotores Activos"
            value={(superStats?.activeUsersPromoters ?? 0).toLocaleString()}
            icon={Briefcase}
            description={`Activos entre ${dateFrom.toLocaleDateString("es-MX")} - ${dateTo.toLocaleDateString("es-MX")}`}
          />
        </div>
      ) : (
        // ── Tarjetas Admin ───────────────────────────────────────────────────
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Mis Establecimientos"
            value={(adminStats?.totalStores ?? 0).toLocaleString()}
            icon={Store}
            description="Establecimientos de tu cliente"
          />
          <StatCard
            title="Mis Pedidos"
            value={(adminStats?.totalOrders ?? 0).toLocaleString()}
            icon={ShoppingCart}
            description="Pedidos generados"
          />
          <StatCard
            title="Total Promotores"
            value={(adminStats?.totalPromoters ?? 0).toLocaleString()}
            icon={UserCheck}
            description="Promotores en la plataforma"
          />
          <StatCard
            title="Promotores Activos"
            value={(adminStats?.activePromoters ?? 0).toLocaleString()}
            icon={Briefcase}
            description="Con cuenta activa"
          />
        </div>
      )}

      {/* Heatmap superadmin — solo si hay datos */}
      {!loading && isSuperAdmin && heatmapData.length > 0 && (
        <PromoterHeatMap promoters={heatmapData} />
      )}

      {/* Heatmap admin — siempre visible una vez cargado (promotores globales) */}
      {!loading && !isSuperAdmin && adminStats !== null && (
        <PromoterHeatMap promoters={heatmapData} />
      )}
    </div>
  );
}
