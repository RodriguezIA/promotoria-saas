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
  recurrence_type: "DIAS" | "SEMANA" | "QUINCENA" | "MES";
  recurrence_days: string | null;
  dt_register: string;
  dt_updated: string;
  stores: RouteTemplateStoreDTO[];
}

export interface RouteTemplateInput {
  id_client: number;
  name: string;
  recurrence_type: "DIAS" | "SEMANA" | "QUINCENA" | "MES";
  recurrence_days?: string | null;
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

export const DIAS_SEMANA = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

export const RECURRENCE_LABELS: Record<string, string> = {
  DIAS: "Días específicos",
  SEMANA: "Toda la semana",
  QUINCENA: "Toda la quincena",
  MES: "Todo el mes",
};
