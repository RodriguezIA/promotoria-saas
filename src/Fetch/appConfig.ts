import { api, ApiResponse } from "@/lib";

export interface AppConfigVideo {
  url: string | null;
}

export const getLoginVideo = () =>
  api.get<ApiResponse<AppConfigVideo>>(`/app-config/login-video`);

export const uploadLoginVideo = (file: File) => {
  const fd = new FormData();
  fd.append("video", file);
  return api.upload<ApiResponse<AppConfigVideo>>(`/app-config/login-video`, fd);
};

export const removeLoginVideo = () =>
  api.delete<ApiResponse<AppConfigVideo>>(`/app-config/login-video`);

export interface TaskInstructionsSetting {
  key: string;
  value: string;
}

export const getTaskInstructions = () =>
  api.get<ApiResponse<TaskInstructionsSetting>>(`/app-config/task-instructions`);

export const setTaskInstructions = (value: string) =>
  api.put<ApiResponse<TaskInstructionsSetting>>(`/app-config/task-instructions`, { value });
