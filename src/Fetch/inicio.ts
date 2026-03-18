import { useAuthStore } from "../store/authStore";

const API_URL = import.meta.env.VITE_API_URL;

const authHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as HeadersInit;
};

export interface DashboardAnalytics {
  totalClients: number;
  totalUsuariosPromotores: number;
  totalStores: number;
  activeUsersPromoters: number;
  heatmapPromoters: HeatmapPromoter[];
}

export interface HeatmapPromoter {
  id_promoter: number;
  vc_name: string;
  f_latitude: number;
  f_longitude: number;
}

export const getDashboardAnalytics = async (
  dateFrom: string,
  dateTo: string
): Promise<DashboardAnalytics> => {
  const params = new URLSearchParams({ dateFrom, dateTo });
  const res = await fetch(
    `${API_URL}/superadmin/analytics/dashboard?${params}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );
  if (!res.ok) throw new Error("Error al obtener analytics del dashboard");
  const json = await res.json();
  return json.data;
};