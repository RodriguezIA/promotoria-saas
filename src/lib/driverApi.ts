import { useDriverAuthStore } from "../stores/driverAuthStore";
import { ApiResponse } from "./api";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiError {
    message?: string;
    details?: string;
}

/**
 * Cliente API separado para el panel del chofer — usa su propio token
 * (driver-auth-storage), nunca el del staff/cliente, para que ambas
 * sesiones puedan convivir sin pisarse.
 */
export const driverApi = {
    getAuthHeaders(): HeadersInit {
        const token = useDriverAuthStore.getState().token;
        return {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    },

    async get<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: "GET",
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<T>(response);
    },

    async post<T>(endpoint: string, body?: unknown): Promise<T> {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });
        return this.handleResponse<T>(response);
    },

    async patch<T>(endpoint: string, body?: unknown): Promise<T> {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: "PATCH",
            headers: this.getAuthHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });
        return this.handleResponse<T>(response);
    },

    async upload<T>(endpoint: string, formData: FormData): Promise<T> {
        const token = useDriverAuthStore.getState().token;
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });
        return this.handleResponse<T>(response);
    },

    async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok && response.status !== 304) {
            const contentType = response.headers.get("content-type") || "";
            const data: ApiError = contentType.includes("application/json")
                ? await response.json()
                : { message: await response.text() };
            throw new Error(data.details || data.message || `Error ${response.status}`);
        }
        const json = await response.json();
        return json as T;
    },
};

export type { ApiResponse };
