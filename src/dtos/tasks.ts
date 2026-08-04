export interface TaskAnswerDTO {
  id_task_answer: number
  id_request_product_question: number
  vc_answer: string | null
  vc_image_url?: string | null
  dt_register: string
}

export interface QuestionOptionLiteDTO {
  id_option: number
  option_text: string
  option_value_numeric?: number | null
  option_order?: number | null
}

export interface RequestProductQuestionDetailDTO {
  id_request_product_question: number
  question: {
    id_question: number
    question: string
    question_type: string
    min_value?: number | null
    max_value?: number | null
    max_photos?: number | null
    question_options?: QuestionOptionLiteDTO[]
  }
}

export interface RequestProductDetailDTO {
  id_request_product: number
  product: { id_product: number; name: string; description?: string | null; vc_image?: string | null }
  request_product_questions: RequestProductQuestionDetailDTO[]
}

export interface TaskDTO {
  id_task: number
  id_client: number
  id_order: number
  id_store: number
  id_request: number
  id_promoter: number | null
  id_status: number
  vc_cancel_reason?: string | null
  vc_cancel_type?: string | null
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
  request?: {
    id_request: number
    vc_name: string
    url_rack_image?: string
    f_value?: number
    vc_folio?: string | null
    request_products?: RequestProductDetailDTO[]
  }
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
  /** Solo la trae GET /tasks/:id/checklist, no GET /tasks/:id */
  myAnswers?: TaskAnswerDTO[]
  /** Solo la trae GET /tasks/:id/checklist, no GET /tasks/:id */
  arrangement_photo_url?: string | null
}
