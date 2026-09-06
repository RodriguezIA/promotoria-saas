import { api, ApiResponse } from "@/lib";

export interface TaskSettings {
  id_setting: number;
  i_review_timeout_hours: number;
  preorder_pricing_type: 'FIXED' | 'PERCENTAGE';
  preorder_pricing_value: number;
  id_user_updater: number | null;
  dt_updated: string;
}

export const getTaskSettings = () =>
  api.get<ApiResponse<TaskSettings>>(`/task-settings`);

export const updateTaskSettings = (i_review_timeout_hours: number) =>
  api.patch<ApiResponse<TaskSettings>>(`/task-settings`, { i_review_timeout_hours });

export const updatePreorderPricing = (pricing_type: 'FIXED' | 'PERCENTAGE', pricing_value: number) =>
  api.patch<ApiResponse<TaskSettings>>(`/task-settings/preorder-pricing`, { pricing_type, pricing_value });
