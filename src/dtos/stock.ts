export type StockSemaphore = 'red' | 'yellow' | 'green' | null

export interface MapProductDTO {
    id_product: number
    name: string
    quantity: number | null
    minimum: number
    semaphore: StockSemaphore
}

export interface MapActivePromoterDTO {
    id_promoter: number
    name: string
    latitude: number
    longitude: number
}

export interface MapStoreDTO {
    id_store: number
    name: string
    latitude: number
    longitude: number
    id_state: number
    state_name: string | null
    id_municipio: number
    municipio_name: string | null
    channel: { id: number; name: string; logo: string | null } | null
    semaphore: StockSemaphore
    products: MapProductDTO[]
    active_promoters: MapActivePromoterDTO[]
}

export interface StockMinimumDTO {
    id_minimum: number
    id_product: number
    id_store: number
    i_minimum: number
    product: { id_product: number; name: string; vc_image: string | null }
}
