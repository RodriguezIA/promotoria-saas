import { api, ApiResponse } from "@/lib";

export interface RouteTemplateStoreDTO {
  id_route_template_store: number;
  id_route_template: number;
  id_store: number;
}

export interface RouteTemplateDTO {
  id_route_template: number;
  id_client: number;
  name: string;
  recurrence_type: "SEMANAL" | "FECHAS";
  day_of_week: number | null;
  interval_weeks: number | null;
  specific_dates: string | null;
  dt_register: string;
  dt_updated: string;
  stores: RouteTemplateStoreDTO[];
}

export interface RouteTemplateInput {
  id_client: number;
  name: string;
  recurrence_type: "SEMANAL" | "FECHAS";
  day_of_week?: number | null;
  interval_weeks?: number | null;
  specific_dates?: string | null;
  storeIds: number[];
}

export const getRouteTemplates = (id_client: number) =>
  api.get<ApiResponse<RouteTemplateDTO[]>>(`/route-templates?id_client=${id_client}`);

export const getRouteTemplateById = (id_route_template: number) =>
  api.get<ApiResponse<RouteTemplateDTO>>(`/route-templates/${id_route_template}`);

export const createRouteTemplate = (data: RouteTemplateInput) =>
  api.post<ApiResponse<RouteTemplateDTO>>(`/route-templates`, data);

export const updateRouteTemplate = (id_route_template: number, data: Omit<RouteTemplateInput, "id_client">) =>
  api.put<ApiResponse<RouteTemplateDTO>>(`/route-templates/${id_route_template}`, data);

export const deleteRouteTemplate = (id_route_template: number) =>
  api.delete<ApiResponse<null>>(`/route-templates/${id_route_template}`);

export interface RouteSalesEstimateStore {
  id_store: number;
  estimated_value: number;
  has_minimums: boolean;
  is_stale: boolean;
  last_update: string | null;
}

export interface RouteSalesEstimateDTO {
  stores: RouteSalesEstimateStore[];
  total: number;
}

export const estimateRouteSales = (storeIds: number[]) =>
  api.post<ApiResponse<RouteSalesEstimateDTO>>(`/route-templates/estimate-sales`, { storeIds });

export const DIAS_SEMANA = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

export const INTERVALOS_SEMANAS = [
  { value: 1, label: "Cada semana" },
  { value: 2, label: "Cada 2 semanas" },
  { value: 3, label: "Cada 3 semanas" },
  { value: 4, label: "Cada 4 semanas" },
];

export const describeRecurrence = (t: Pick<RouteTemplateDTO, "recurrence_type" | "day_of_week" | "interval_weeks" | "specific_dates">) => {
  if (t.recurrence_type === "SEMANAL") {
    const dia = DIAS_SEMANA.find((d) => d.value === t.day_of_week)?.label ?? "";
    const intervalo = INTERVALOS_SEMANAS.find((i) => i.value === t.interval_weeks)?.label ?? "";
    return `Todos los ${dia} · ${intervalo}`;
  }
  if (t.recurrence_type === "FECHAS" && t.specific_dates) {
    const fechas = t.specific_dates.split(",");
    return `${fechas.length} fecha${fechas.length !== 1 ? "s" : ""} específica${fechas.length !== 1 ? "s" : ""}`;
  }
  return "";
};
