import { api, ApiResponse } from "@/lib";

export interface RouteScheduleDTO {
  id_schedule: number;
  id_client: number;
  id_route_template: number;
  id_driver: number;
  day_of_week: number;
  interval_weeks: number;
  anchor_date: string;
  is_active: boolean;
  dt_register: string;
  route_template: { id_route_template: number; name: string };
  driver: { id_driver: number; name: string };
}

export interface RouteScheduleInput {
  id_client: number;
  id_route_template: number;
  id_driver: number;
  day_of_week: number;
  interval_weeks: number;
  anchor_date: string;
}

export const getRouteSchedules = (id_client: number) =>
  api.get<ApiResponse<RouteScheduleDTO[]>>(`/route-schedules?id_client=${id_client}`);

export const createRouteSchedule = (data: RouteScheduleInput) =>
  api.post<ApiResponse<RouteScheduleDTO>>(`/route-schedules`, data);

export const deleteRouteSchedule = (id_schedule: number) =>
  api.delete<ApiResponse<null>>(`/route-schedules/${id_schedule}`);

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
  { value: 1, label: "1 vez por semana" },
  { value: 2, label: "1 vez cada 2 semanas" },
  { value: 3, label: "1 vez cada 3 semanas" },
  { value: 4, label: "1 vez cada 4 semanas" },
];

export const describeSchedule = (s: Pick<RouteScheduleDTO, "day_of_week" | "interval_weeks">) => {
  const dia = DIAS_SEMANA.find((d) => d.value === s.day_of_week)?.label ?? "";
  const intervalo = INTERVALOS_SEMANAS.find((i) => i.value === s.interval_weeks)?.label ?? "";
  return `Todos los ${dia} · ${intervalo}`;
};
