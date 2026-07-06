export interface PromoterDTO {
  id: number
  name: string
  lastname?: string
  email?: string
  phone: string
  vc_image?: string | null
  fcm_token?: string | null
  isActive: boolean
  dt_register?: string
  dt_updated?: string
  dt_last_login?: string | null
  latitude?: number | null
  longitude?: number | null
}
