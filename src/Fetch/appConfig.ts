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
