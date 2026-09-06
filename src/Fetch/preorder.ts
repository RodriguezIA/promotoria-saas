import { api, ApiResponse } from '@/lib'

export interface PreorderItemDTO {
    id_item: number
    id_product: number
    i_quantity: number
    product: { id_product: number; name: string }
}

export interface PreorderDTO {
    id_preorder: number
    id_task: number
    manager_whatsapp: string
    manager_signature: string
    preferred_date: string
    preferred_time: 'MAÑANA' | 'TARDE'
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

// El endpoint de una sola tarea no incluye la relacion `task` (ya se tiene
// ese contexto en la pantalla que lo llama), asi que aqui es opcional.
export const getPreorder = (id_task: number) =>
    api.get<ApiResponse<Omit<PreorderDTO, 'task'> | null>>(`/preorder/tasks/${id_task}`)
