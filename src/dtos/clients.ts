export interface ClientDTO {
    id_client: number
    id_user: number
    name: string
    vc_initialism: string
    i_status: number
    dt_register: string
    dt_updated: string
    rfc?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    addiccional_notes?: string
    vc_url_situacion_fiscal?: string | null
}
