import { api, ApiResponse } from "@/lib";

export interface TaskSettings {
  id_setting: number;
  i_review_timeout_hours: number;
  id_user_updater: number | null;
  dt_updated: string;
}

export const getTaskSettings = () =>
  api.get<ApiResponse<TaskSettings>>(`/task-settings`);

export const updateTaskSettings = (i_review_timeout_hours: number) =>
  api.patch<ApiResponse<TaskSettings>>(`/task-settings`, { i_review_timeout_hours });
