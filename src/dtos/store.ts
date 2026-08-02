import { AddressDTO } from './address'
import { channelSaleEstablecimientoDTO } from './channel_sales'

export interface StoreLogDTO {
    id_store_log: number
    id_store: number
    id_user: number
    log: string
    dt_register: string
    users?: {
        name: string
        lastname: string
    }
}

export interface StoreDTO {
    id_store: number
    id_user: number
    id_channel_sale?: number
    name: string
    store_code?: string
    i_status: boolean,
    dt_register: string
    dt_updated: string
    address: AddressDTO,
    sales_channel: channelSaleEstablecimientoDTO
    logs?: StoreLogDTO[]
}