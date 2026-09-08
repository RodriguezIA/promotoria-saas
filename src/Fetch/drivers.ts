import { api, ApiResponse } from '@/lib'

export interface DriverDTO {
    id_driver: number
    name: string
    phone: string
    email: string | null
    vc_photo: string | null
    dt_location_updated: string | null
    dt_register: string
}

export const getDrivers = () =>
    api.get<ApiResponse<DriverDTO[]>>('/drivers')

export const createDriver = (data: { name: string; phone: string; email?: string; password: string }) =>
    api.post<ApiResponse<DriverDTO>>('/drivers', data)

export const updateDriver = (id_driver: number, data: { name?: string; phone?: string; email?: string }) =>
    api.put<ApiResponse<DriverDTO>>(`/drivers/${id_driver}`, data)

export const deactivateDriver = (id_driver: number) =>
    api.delete<ApiResponse<null>>(`/drivers/${id_driver}`)
