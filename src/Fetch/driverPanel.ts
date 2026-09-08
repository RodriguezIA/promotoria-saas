import { driverApi, ApiResponse } from '@/lib/driverApi'
import { DriverProfile } from '@/stores/driverAuthStore'

export interface DriverLoginResponse {
    token: string
    driver: DriverProfile
}

export const driverLogin = (phone: string, password: string) =>
    driverApi.post<ApiResponse<DriverLoginResponse>>('/drivers/login', { phone, password })

export const getDriverProfile = () =>
    driverApi.get<ApiResponse<DriverProfile>>('/drivers/me/profile')

export const updateDriverPassword = (current_password: string, new_password: string) =>
    driverApi.patch<ApiResponse<null>>('/drivers/me/password', { current_password, new_password })

export const updateDriverLocation = (latitude: number, longitude: number) =>
    driverApi.patch<ApiResponse<null>>('/drivers/me/location', { latitude, longitude })

export interface DriverRouteStopDTO {
    id_stop: number
    id_store: number
    id_preorder: number | null
    i_order: number
    i_status: number
    b_delivered: boolean | null
    vc_no_delivery_reason: string | null
    payment_method: string | null
    f_amount_paid: number | null
    dt_visited: string | null
    store: {
        id_store: number
        name: string
        address?: { latitude: number | null; longitude: number | null; street: string } | null
    }
    preorder: {
        preferred_date: string
        preferred_time: 'MAÑANA' | 'TARDE'
        items: { i_quantity: number; product: { name: string } }[]
    } | null
}

export interface DriverRouteDTO {
    id_route: number
    route_date: string
    stops: DriverRouteStopDTO[]
}

export const getMyRoutes = () =>
    driverApi.get<ApiResponse<DriverRouteDTO[]>>('/delivery-routes/mine')

export const updateStop = (id_stop: number, data: {
    i_status?: number
    b_delivered?: boolean
    vc_no_delivery_reason?: string
    payment_method?: 'EFECTIVO' | 'TRANSFERENCIA' | 'CONSIGNA'
    f_amount_paid?: number
}) =>
    driverApi.patch<ApiResponse<DriverRouteStopDTO>>(`/delivery-routes/stops/${id_stop}`, data)
