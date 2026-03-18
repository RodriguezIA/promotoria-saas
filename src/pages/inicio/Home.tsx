import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { StatCard } from "../../components/dashboard/StatCard";
import { DateRangePicker } from "../../components/dashboard/DateRangePicker";
import { HeatMap } from "../../components/dashboard/HeatMap";
import { Users, Store, TrendingUp, TrendingDown, UserCheck, Briefcase, Loader2,} from "lucide-react";
import {
  mockSuperAdminStats,
  mockAdminStats,
  mockPromoterLocations,
  getStatsForNegocio,
  getPromotersForNegocio,
  DashboardStats,
  PromoterLocation,
} from "../../data/mockDashboard";
import { PromoterHeatMap } from "./components/PromoterHearMap";

import { getDashboardAnalytics, DashboardAnalytics } from "../../Fetch/inicio";


const defaultDateFrom = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d;
};

const toISOLocal = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export default function Home() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.i_rol === 1;

  const [dateFrom, setDateFrom] = useState<Date>(defaultDateFrom());
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async (from: Date, to: Date) => {
    if (!isSuperAdmin) return;
    try {
      setLoading(true);
      const data = await getDashboardAnalytics(toISOLocal(from), toISOLocal(to));
      setAnalytics(data);
    } catch (error) {
      console.error("Error cargando analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    fetchAnalytics(dateFrom, dateTo);
  }, []);

  const handleDateChange = (from: Date | undefined, to: Date | undefined) => {
    if (!from || !to) return;
    setDateFrom(from);
    setDateTo(to);
    fetchAnalytics(from, to);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isSuperAdmin ? "Vista general de todos los negocios" : "Vista de tu negocio"}
          </p>
        </div>
        <DateRangePicker onDateChange={handleDateChange} />
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Clientes"
              value={(analytics?.totalClients ?? 0).toLocaleString()}
              icon={Users}
              description="Total de clientes"
              trend={{ value: 12.5, isPositive: true }}
            />
            <StatCard
              title="Usuarios Promotores"
              value={(analytics?.totalUsuariosPromotores ?? 0).toLocaleString()}
              icon={UserCheck}
              description="Promotores registrados"
              trend={{ value: 8.2, isPositive: true }}
            />
            <StatCard
              title="Establecimientos"
              value={(analytics?.totalStores ?? 0).toLocaleString()}
              icon={Store}
              description="Total establecimientos"
              trend={{ value: 3.1, isPositive: true }}
            />
            <StatCard
              title="Promotores Activos"
              value={(analytics?.activeUsersPromoters ?? 0).toLocaleString()}
              icon={Briefcase}
              description={`Activos entre ${dateFrom.toLocaleDateString("es-MX")} - ${dateTo.toLocaleDateString("es-MX")}`}
            />
          </div>

          {/* Heatmap */}
          {analytics?.heatmapPromoters && analytics.heatmapPromoters.length > 0 && (
            <PromoterHeatMap promoters={analytics.heatmapPromoters} />
          )}
        </>
      )}
    </div>
  );
}
