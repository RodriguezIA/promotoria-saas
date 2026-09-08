import { api, ApiResponse } from '@/lib'

export interface PreorderItemDTO {
    id_item: number
    id_product: number
    i_quantity: number
    i_quantity_immediate: number | null
    i_quantity_backorder: number | null
    i_backorder_days: number | null
    product: { id_product: number; name: string }
}

export interface PreorderDTO {
    id_preorder: number
    id_task: number
    manager_whatsapp: string
    manager_signature: string
    preferred_date: string
    preferred_time: 'MAÑANA' | 'TARDE'
    id_status: number // 0 = sin surtir, 1 = surtido
    dt_register: string
    items: PreorderItemDTO[]
    task: {
        id_task: number
        vc_folio: string | null
        store: { id_store: number; name: string }
        promoter: { id: number; name: string; lastname: string | null } | null
    }
}

export const getPreordersByClient = (id_client: number) =>
    api.get<ApiResponse<PreorderDTO[]>>(`/preorder/clients/${id_client}`)

export const updatePreorderStatus = (id_task: number, id_status: 0 | 1) =>
    api.patch<ApiResponse<{ id_status: number }>>(`/preorder/tasks/${id_task}/status`, { id_status })

// El endpoint de una sola tarea no incluye la relacion `task` (ya se tiene
// ese contexto en la pantalla que lo llama), asi que aqui es opcional.
export const getPreorder = (id_task: number) =>
    api.get<ApiResponse<Omit<PreorderDTO, 'task'> | null>>(`/preorder/tasks/${id_task}`)
