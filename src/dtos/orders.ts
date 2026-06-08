export interface OrderItemSummaryDTO {
    id_order_item: number
    id_order: number
    id_request: number
    id_store: number
    f_value: number
    request?: { id_request: number; vc_name: string; f_value: number }
    store?: { id_store: number; name: string }
}

export interface OrderDTO {
    id_order: number
    id_user: number
    id_client: number
    f_total: number
    dt_register: string
    dt_update: string
    id_status: number
    order_items?: OrderItemSummaryDTO[]
    order_logs?: OrderLogDTO[]
}

export interface OrderLogDTO {
  id_log: number
  id_order: number
  id_usuario: number | null
  vc_log: string
  i_status: number
  dt_registro: string
}

export interface OderListDTO {
    data: OrderDTO[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}