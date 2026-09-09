import { api, ApiResponse } from "@/lib";
import { useAuthStore } from "@/stores/authStore";

const API_URL = import.meta.env.VITE_API_URL;

export interface ChannelSaleDTO {
  id: number;
  name: string;
  description?: string;
  url_image?: string;
}

export const getChannels = () =>
  api.get<ApiResponse<ChannelSaleDTO[]>>("/channel-sales");

const authHeadersNoContentType = (): HeadersInit => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const buildFormData = (data: { name: string; description: string }, file?: File | null) => {
  const fd = new FormData();
  fd.append("data", JSON.stringify(data));
  if (file) fd.append("file", file);
  return fd;
};

const handleResponse = async <T>(res: Response): Promise<T> => {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.ok === false) {
    throw new Error(json?.message || "Error en la solicitud");
  }
  return json;
};

export const createChannel = async (data: { name: string; description: string }, file?: File | null) => {
  const res = await fetch(`${API_URL}/channel-sales`, {
    method: "POST",
    headers: authHeadersNoContentType(),
    body: buildFormData(data, file),
  });
  return handleResponse<ApiResponse<ChannelSaleDTO>>(res);
};

export const updateChannel = async (id: number, data: { name: string; description: string }, file?: File | null) => {
  const res = await fetch(`${API_URL}/channel-sales/${id}`, {
    method: "PUT",
    headers: authHeadersNoContentType(),
    body: buildFormData(data, file),
  });
  return handleResponse<ApiResponse<ChannelSaleDTO>>(res);
};

export const deleteChannel = (id: number) =>
  api.delete<ApiResponse<null>>(`/channel-sales/${id}`);
