import { api, ApiResponse } from '@/lib'
import { MapStoreDTO, StockMinimumDTO } from '@/dtos'

export const getStockMapData = (filters: { id_channel?: number; id_state?: number; id_municipio?: number; id_client?: number }) => {
    const params = new URLSearchParams()
    if (filters.id_channel) params.set('id_channel', String(filters.id_channel))
    if (filters.id_state) params.set('id_state', String(filters.id_state))
    if (filters.id_municipio) params.set('id_municipio', String(filters.id_municipio))
    if (filters.id_client) params.set('id_client', String(filters.id_client))
    const qs = params.toString()
    return api.get<ApiResponse<MapStoreDTO[]>>(`/stock/map${qs ? `?${qs}` : ''}`)
}

export const getStockMinimumsByStore = (id_store: number, id_client?: number) => {
    const qs = id_client ? `?id_client=${id_client}` : ''
    return api.get<ApiResponse<StockMinimumDTO[]>>(`/stock/minimums/${id_store}${qs}`)
}

export const setStockMinimum = (data: { id_product: number; id_store: number; i_minimum: number }) => {
    return api.put<ApiResponse<StockMinimumDTO>>('/stock/minimums', data)
}

export const countStockMatchingStores = (filters: { id_channels?: number[]; id_state?: number; id_municipios?: number[] }) => {
    const params = new URLSearchParams()
    filters.id_channels?.forEach((id) => params.append('id_channels', String(id)))
    if (filters.id_state) params.set('id_state', String(filters.id_state))
    filters.id_municipios?.forEach((id) => params.append('id_municipios', String(id)))
    const qs = params.toString()
    return api.get<ApiResponse<{ count: number }>>(`/stock/minimums/matching-stores/count${qs ? `?${qs}` : ''}`)
}

export const bulkAssignStockMinimum = (data: {
    id_products: number[]
    i_minimum: number
    id_channels?: number[]
    id_state?: number
    id_municipios?: number[]
}) => {
    return api.post<ApiResponse<{ stores_affected: number; assignments: number }>>('/stock/minimums/bulk-assign', data)
}
