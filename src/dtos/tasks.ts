export interface TaskDTO {
  id_task: number
  id_client: number
  id_order: number
  id_store: number
  id_request: number
  id_promoter: number | null
  id_status: number
  dt_register: string
  dt_update?: string
  i_notification_count?: number
  i_current_cycle?: number
  dt_next_retry?: string | null
  vc_folio?: string | null
  client?: { id_client: number; name: string; vc_initialism?: string }
  order?: { id_order: number; f_total: number; id_status?: number; vc_folio?: string | null }
  store?: { id_store: number; name: string; store_code?: string }
  promoter?: { id: number; name: string; lastname: string; phone: string; email?: string } | null
  request?: { id_request: number; vc_name: string; url_rack_image?: string; f_value?: number; vc_folio?: string | null }
  storeAddress?: {
    street?: string
    ext_number?: string
    int_number?: string
    neighborhood?: string
    postal_code?: string
    address_references?: string
    latitude?: number
    longitude?: number
    city?: { id: number; name: string }
    state?: { id: number; name: string }
  } | null
}
