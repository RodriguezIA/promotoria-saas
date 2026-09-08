import { api, ApiResponse } from '@/lib'

export interface PendingPreorderDTO {
    id_preorder: number
    id_task: number
    preferred_date: string
    preferred_time: 'MAÑANA' | 'TARDE'
    items: { id_item: number; i_quantity: number; product: { id_product: number; name: string } }[]
    task: {
        id_task: number
        vc_folio: string | null
        store: {
            id_store: number
            name: string
            address: { latitude: number | null; longitude: number | null; street: string } | null
        }
    }
}

export interface RouteStopDTO {
    id_stop: number
    id_store: number
    id_preorder: number
    i_order: number
    i_status: number
    b_delivered: boolean | null
    vc_no_delivery_reason: string | null
    payment_method: string | null
    f_amount_paid: number | null
    dt_visited: string | null
    store: { id_store: number; name: string }
    preorder: { items: { i_quantity: number; product: { name: string } }[] }
}

export interface RouteDTO {
    id_route: number
    id_driver: number
    route_date: string
    driver: { id_driver: number; name: string; phone: string }
    stops: RouteStopDTO[]
}

export const getPendingPreorders = (filters?: { date?: string; time?: 'MAÑANA' | 'TARDE' }) => {
    const params = new URLSearchParams()
    if (filters?.date) params.set('date', filters.date)
    if (filters?.time) params.set('time', filters.time)
    const qs = params.toString()
    return api.get<ApiResponse<PendingPreorderDTO[]>>(`/delivery-routes/pending-preorders${qs ? `?${qs}` : ''}`)
}

export const createRoute = (data: { id_driver: number; route_date: string; stops: { id_store: number; id_preorder: number }[] }) =>
    api.post<ApiResponse<RouteDTO>>('/delivery-routes', data)

export const getRoutes = () =>
    api.get<ApiResponse<RouteDTO[]>>('/delivery-routes')
