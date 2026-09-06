import { api, ApiResponse } from "@/lib";

export interface FinanceSettings {
  f_promoter_commission_percentage: number;
  f_activator_commission_percentage: number;
}

export const getFinanceSettings = () =>
  api.get<ApiResponse<FinanceSettings>>(`/finances/settings`);

export const updateFinanceSettings = (data: Partial<FinanceSettings>) =>
  api.patch<ApiResponse<FinanceSettings>>(`/finances/settings`, data);
