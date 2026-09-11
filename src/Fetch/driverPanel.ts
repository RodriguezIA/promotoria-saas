import { driverApi, ApiResponse } from '@/lib/driverApi'
import { DriverProfile } from '@/stores/driverAuthStore'

export interface DriverLoginResponse {
    token: string
    driver: DriverProfile
}

export const driverLogin = (phone: string, password: string) =>
    driverApi.post<ApiResponse<DriverLoginResponse>>('/drivers/login', { phone, password })

export const checkDriverPhoneExists = async (phone: string): Promise<boolean> => {
    try {
        const res = await driverApi.get<ApiResponse<{ exists: boolean }>>(`/drivers/check-phone/${phone}`)
        return res.data.exists === true
    } catch {
        return false
    }
}

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
    b_consigna: boolean
    f_amount_cash: number | null
    f_amount_transfer: number | null
    f_total_charged: number | null
    dt_visited: string | null
    store: {
        id_store: number
        name: string
        address?: { latitude: number | null; longitude: number | null; street: string } | null
    }
    preorder: {
        preferred_date: string
        preferred_time: 'MAÑANA' | 'TARDE'
        manager_whatsapp: string
        items: { i_quantity: number; product: { name: string } }[]
    } | null
    items?: { id_item: number; i_quantity: number; product: { id_product: number; name: string } }[]
}

export interface DriverRouteDTO {
    id_route: number
    route_date: string
    is_finished: boolean
    route_template: { id_route_template: number; name: string } | null
    stops: DriverRouteStopDTO[]
}

export const getMyRoutes = () =>
    driverApi.get<ApiResponse<DriverRouteDTO[]>>('/delivery-routes/mine')

export const updateStop = (id_stop: number, data: {
    i_status?: number
    b_delivered?: boolean
    vc_no_delivery_reason?: string
    b_consigna?: boolean
    f_amount_cash?: number
    f_amount_transfer?: number
    items?: { id_product: number; quantity: number }[]
}) =>
    driverApi.patch<ApiResponse<DriverRouteStopDTO>>(`/delivery-routes/stops/${id_stop}`, data)

export interface DriverProductDTO {
    id_product: number
    name: string
    vc_image: string | null
    f_store_price: number | null
}

export const getDriverProducts = (id_client: number) =>
    driverApi.get<ApiResponse<DriverProductDTO[]>>(`/products/${id_client}`)

export interface DriverStoreMinimumDTO {
    id_product: number
    i_minimum: number
    product: { id_product: number; name: string; vc_image: string | null }
}

export const getDriverStoreMinimums = (id_store: number) =>
    driverApi.get<ApiResponse<DriverStoreMinimumDTO[]>>(`/stock/minimums/${id_store}`)

export interface DriverStockReadingDTO {
    id_product: number
    i_quantity: number
    dt_register: string
    product: { id_product: number; name: string; vc_image: string | null }
}

export const getDriverStockReadings = (id_store: number) =>
    driverApi.get<ApiResponse<DriverStockReadingDTO[]>>(`/stock/readings/${id_store}`)

export interface DriverStateDTO { id: number; name: string }
export interface DriverCityDTO { id: number; name: string }
export interface DriverChannelDTO { id: number; name: string }

export const getDriverStates = (id_country: number) =>
    driverApi.get<ApiResponse<DriverStateDTO[]>>(`/clients/states/${id_country}`)

export const getDriverCities = (id_state: number) =>
    driverApi.get<ApiResponse<DriverCityDTO[]>>(`/clients/cities/${id_state}`)

export const getDriverChannels = () =>
    driverApi.get<ApiResponse<DriverChannelDTO[]>>(`/channel-sales`)

export const createDriverStore = (data: {
    name: string
    id_channel_sale?: number
    store_code?: string
    id_state: number
    id_city: number
    street?: string
    ext_number?: string
    postal_code?: string
    latitude?: string
    longitude?: string
}) =>
    driverApi.post<ApiResponse<{ id_store: number }>>(`/drivers/me/stores`, data)
